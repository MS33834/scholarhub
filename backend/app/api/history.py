from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import ReadingHistory, Resource, User

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/")
async def get_history(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ReadingHistory)
        .where(ReadingHistory.user_id == current_user.id)
        .order_by(ReadingHistory.viewed_at.desc())
        .limit(50)
    )
    history = result.scalars().all()

    resource_ids = [h.resource_id for h in history]
    if not resource_ids:
        return {"history": []}

    result = await db.execute(select(Resource).where(Resource.id.in_(resource_ids)))
    resources = result.scalars().all()
    return {"history": resources}


@router.post("/{resource_id}")
async def add_to_history(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    history = ReadingHistory(user_id=current_user.id, resource_id=resource_id)
    db.add(history)
    await db.commit()
    return {"message": "Added to history"}
