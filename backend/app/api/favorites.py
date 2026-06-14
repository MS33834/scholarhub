from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Favorite, Resource, User

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/")
async def get_favorites(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Favorite).where(Favorite.user_id == current_user.id))
    favorites = result.scalars().all()

    resource_ids = [f.resource_id for f in favorites]
    if not resource_ids:
        return {"favorites": []}

    result = await db.execute(select(Resource).where(Resource.id.in_(resource_ids)))
    resources = result.scalars().all()
    return {"favorites": resources}


@router.post("/{resource_id}", status_code=201)
async def add_favorite(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if resource exists
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Resource not found")

    # Check if already favorited
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id, Favorite.resource_id == resource_id
        )
    )
    if result.scalar_one_or_none():
        return {"message": "Already favorited"}

    favorite = Favorite(user_id=current_user.id, resource_id=resource_id)
    db.add(favorite)
    await db.commit()
    return {"message": "Added to favorites"}


@router.delete("/{resource_id}", status_code=204)
async def remove_favorite(
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
        raise HTTPException(status_code=404, detail="Favorite not found")

    await db.delete(favorite)
    await db.commit()
