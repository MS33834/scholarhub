from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.limiter import rate_limit
from app.db.session import get_db
from app.models.models import ReadingHistory, Resource, User
from app.schemas import (
    HistoryCreateResponse,
    HistoryEntryResponse,
    HistoryListResponse,
    ResourceResponse,
)

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/", response_model=HistoryListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_history(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReadingHistory, Resource)
        .join(Resource, ReadingHistory.resource_id == Resource.id)
        .where(ReadingHistory.user_id == current_user.id)
        .order_by(ReadingHistory.viewed_at.desc())
        .limit(50)
    )
    rows = result.all()

    return HistoryListResponse(
        history=[
            HistoryEntryResponse(
                resource=ResourceResponse.model_validate(resource),
                viewed_at=history.viewed_at,
            )
            for history, resource in rows
        ]
    )


@router.post(
    "/{resource_id}", status_code=status.HTTP_201_CREATED, response_model=HistoryCreateResponse
)
@rate_limit("60/minute")
async def add_to_history(
    request: Request,
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    history = ReadingHistory(user_id=current_user.id, resource_id=resource_id)
    db.add(history)
    await db.commit()
    return HistoryCreateResponse(message="Added to history")


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit("60/minute")
async def remove_from_history(
    request: Request,
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReadingHistory).where(
            ReadingHistory.user_id == current_user.id,
            ReadingHistory.resource_id == resource_id,
        )
    )
    entry = result.scalar_one_or_none()
    if entry:
        await db.delete(entry)
        await db.commit()
