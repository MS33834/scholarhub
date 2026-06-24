from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
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

_REFRESH_COOKIE_KEY = settings.refresh_token_cookie_name


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set the refresh token as an HttpOnly cookie."""
    response.set_cookie(
        key=_REFRESH_COOKIE_KEY,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.refresh_token_expire_days * 86400,
        path="/api/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Delete the refresh token cookie."""
    response.delete_cookie(
        key=_REFRESH_COOKIE_KEY,
        path="/api/auth",
        samesite=settings.cookie_samesite,
    )


def _extract_refresh_token(request: Request, body_token: str | None) -> str | None:
    """Read the refresh token from the cookie first, falling back to the body.

    Cookie takes priority because it is HttpOnly and cannot be read by
    JavaScript, making it resistant to XSS token theft.
    """
    cookie_token = request.cookies.get(_REFRESH_COOKIE_KEY)
    return cookie_token or body_token


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@rate_limit("10/minute")
async def register(
    request: Request,
    response: Response,
    req: UserCreate,
    db: AsyncSession = Depends(get_db),
):
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
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=token,
        refresh_token=refresh_token,
        user_id=user.id,
        username=user.username,
        is_admin=user.is_admin,
    )


@router.post("/login", response_model=TokenResponse)
@rate_limit("10/minute")
async def login(
    request: Request,
    response: Response,
    req: UserLogin,
    db: AsyncSession = Depends(get_db),
):
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
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=token,
        refresh_token=refresh_token,
        user_id=user.id,
        username=user.username,
        is_admin=user.is_admin,
    )


@router.post("/refresh", response_model=TokenResponse)
@rate_limit("10/minute")
async def refresh(
    request: Request,
    response: Response,
    req: RefreshTokenRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    body_token = req.refresh_token if req else None
    raw_token = _extract_refresh_token(request, body_token)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    payload = decode_token(raw_token, expected_type="refresh")
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

    new_access_token = create_access_token(
        {"sub": str(user.id), "token_version": user.token_version}
    )
    new_refresh_token = create_refresh_token(
        {"sub": str(user.id), "token_version": user.token_version}
    )
    token_response = TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user_id=user.id,
        username=user.username,
        is_admin=user.is_admin,
    )
    _set_refresh_cookie(response, new_refresh_token)
    return token_response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate all issued tokens for the current user and clear the cookie."""
    current_user.token_version += 1
    await db.commit()
    _clear_refresh_cookie(response)
    return None


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
