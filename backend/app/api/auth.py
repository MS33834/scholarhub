from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.limiter import rate_limit
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    token_version_matches,
    verify_password,
)
from app.db.session import get_db
from app.models.models import User
from app.schemas import RefreshTokenRequest, TokenResponse, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@rate_limit("10/minute")
async def register(request: Request, req: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where((User.email == req.email) | (User.username == req.username))
    )
    if result.first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    user = User(
        email=req.email,
        username=req.username,
        hashed_password=hash_password(req.password),
        is_admin=False,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "token_version": user.token_version})
    refresh_token = create_refresh_token({"sub": str(user.id), "token_version": user.token_version})
    return TokenResponse(
        access_token=token,
        refresh_token=refresh_token,
        user_id=user.id,
        username=user.username,
        is_admin=user.is_admin,
    )


@router.post("/login", response_model=TokenResponse)
@rate_limit("10/minute")
async def login(request: Request, req: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled"
        )

    token = create_access_token({"sub": str(user.id), "token_version": user.token_version})
    refresh_token = create_refresh_token({"sub": str(user.id), "token_version": user.token_version})
    return TokenResponse(
        access_token=token,
        refresh_token=refresh_token,
        user_id=user.id,
        username=user.username,
        is_admin=user.is_admin,
    )


@router.post("/refresh", response_model=TokenResponse)
@rate_limit("10/minute")
async def refresh(request: Request, req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token, expected_type="refresh")
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active or not token_version_matches(payload, user.token_version):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    new_access_token = create_access_token({"sub": str(user.id), "token_version": user.token_version})
    new_refresh_token = create_refresh_token({"sub": str(user.id), "token_version": user.token_version})
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user_id=user.id,
        username=user.username,
        is_admin=user.is_admin,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Invalidate all issued tokens for the current user."""
    current_user.token_version += 1
    await db.commit()
    return None


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
