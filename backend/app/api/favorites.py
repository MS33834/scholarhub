from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.limiter import rate_limit
from app.db.session import get_db
from app.models.models import Favorite, Resource, User
from app.schemas import FavoriteCreateResponse, FavoriteListResponse, ResourceResponse

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/", response_model=FavoriteListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_favorites(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite)
        .options(selectinload(Favorite.resource))
        .where(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
    )
    favorites = result.scalars().all()
    resources = [f.resource for f in favorites if f.resource is not None]
    return FavoriteListResponse(favorites=[ResourceResponse.model_validate(r) for r in resources])


@router.post(
    "/{resource_id}", status_code=status.HTTP_201_CREATED, response_model=FavoriteCreateResponse
)
@rate_limit("30/minute")
async def add_favorite(
    request: Request,
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if resource exists
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    # Check if already favorited
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id, Favorite.resource_id == resource_id
        )
    )
    if result.scalar_one_or_none():
        return FavoriteCreateResponse(message="Already favorited")

    favorite = Favorite(user_id=current_user.id, resource_id=resource_id)
    db.add(favorite)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return FavoriteCreateResponse(message="Already favorited")
    return FavoriteCreateResponse(message="Added to favorites")


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit("30/minute")
async def remove_favorite(
    request: Request,
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id, Favorite.resource_id == resource_id
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")

    await db.delete(favorite)
    await db.commit()
