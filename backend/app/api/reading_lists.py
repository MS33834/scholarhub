from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.limiter import rate_limit
from app.db.session import get_db
from app.models.models import ReadingList, ReadingListItem, Resource, User
from app.schemas import (
    ReadingListCreate,
    ReadingListDetailResponse,
    ReadingListItemCreate,
    ReadingListListResponse,
    ReadingListUpdate,
)

router = APIRouter(prefix="/reading-lists", tags=["reading-lists"])


def _check_ownership(reading_list: ReadingList, current_user: User) -> None:
    if reading_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )


async def _load_reading_list_detail(
    db: AsyncSession, list_id: int
) -> ReadingList:
    """Load a reading list with items and their resources eagerly."""
    result = await db.execute(select(ReadingList).where(ReadingList.id == list_id))
    reading_list = result.scalar_one_or_none()
    if reading_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reading list not found"
        )

    items_result = await db.execute(
        select(ReadingListItem)
        .options(selectinload(ReadingListItem.resource))
        .where(ReadingListItem.reading_list_id == list_id)
        .order_by(ReadingListItem.added_at)
    )
    reading_list.items = items_result.scalars().all()
    reading_list.item_count = len(reading_list.items)
    return reading_list


@router.get("/", response_model=ReadingListListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def list_reading_lists(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReadingList)
        .where(ReadingList.user_id == current_user.id)
        .order_by(ReadingList.created_at.desc())
    )

    reading_lists = result.scalars().all()
    for r in reading_lists:
        await _load_reading_list_detail(db, r.id)
    data = [ReadingListDetailResponse.model_validate(r) for r in reading_lists]
    return ReadingListListResponse(data=data)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ReadingListDetailResponse)
@rate_limit("30/minute")
async def create_reading_list(
    request: Request,
    payload: ReadingListCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reading_list = ReadingList(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        is_public=payload.is_public,
    )
    db.add(reading_list)
    await db.commit()
    await db.refresh(reading_list)
    reading_list.item_count = 0
    reading_list.items = []
    return ReadingListDetailResponse.model_validate(reading_list)


@router.get("/{list_id}", response_model=ReadingListDetailResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_reading_list(
    request: Request,
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reading_list = await _load_reading_list_detail(db, list_id)
    _check_ownership(reading_list, current_user)
    return ReadingListDetailResponse.model_validate(reading_list)


@router.patch("/{list_id}", response_model=ReadingListDetailResponse)
@rate_limit("30/minute")
async def update_reading_list(
    request: Request,
    list_id: int,
    payload: ReadingListUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ReadingList).where(ReadingList.id == list_id))
    reading_list = result.scalar_one_or_none()
    if not reading_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reading list not found"
        )
    _check_ownership(reading_list, current_user)

    if payload.name is not None:
        reading_list.name = payload.name
    if payload.description is not None:
        reading_list.description = payload.description
    if payload.is_public is not None:
        reading_list.is_public = payload.is_public
    reading_list.updated_at = datetime.now(timezone.utc)

    await db.commit()

    reading_list = await _load_reading_list_detail(db, list_id)
    _check_ownership(reading_list, current_user)
    return ReadingListDetailResponse.model_validate(reading_list)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit("30/minute")
async def delete_reading_list(
    request: Request,
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReadingList).where(ReadingList.id == list_id)
    )
    reading_list = result.scalar_one_or_none()
    if not reading_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reading list not found"
        )
    _check_ownership(reading_list, current_user)

    await db.delete(reading_list)
    await db.commit()


@router.post(
    "/{list_id}/items",
    status_code=status.HTTP_201_CREATED,
    response_model=ReadingListDetailResponse,
)
@rate_limit("30/minute")
async def add_item_to_reading_list(
    request: Request,
    list_id: int,
    payload: ReadingListItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ReadingList).where(ReadingList.id == list_id))
    reading_list = result.scalar_one_or_none()
    if not reading_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reading list not found"
        )
    _check_ownership(reading_list, current_user)

    resource_result = await db.execute(
        select(Resource).where(Resource.id == payload.resource_id)
    )
    if not resource_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found"
        )

    existing = await db.execute(
        select(ReadingListItem).where(
            ReadingListItem.reading_list_id == list_id,
            ReadingListItem.resource_id == payload.resource_id,
        )
    )
    if existing.scalar_one_or_none():
        reading_list = await _load_reading_list_detail(db, list_id)
        _check_ownership(reading_list, current_user)
        return ReadingListDetailResponse.model_validate(reading_list)

    item = ReadingListItem(reading_list_id=list_id, resource_id=payload.resource_id)
    db.add(item)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resource already in reading list",
        )

    reading_list = await _load_reading_list_detail(db, list_id)
    _check_ownership(reading_list, current_user)
    return ReadingListDetailResponse.model_validate(reading_list)


@router.delete(
    "/{list_id}/items/{resource_id}",
    response_model=ReadingListDetailResponse,
)
@rate_limit("30/minute")
async def remove_item_from_reading_list(
    request: Request,
    list_id: int,
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ReadingList).where(ReadingList.id == list_id))
    reading_list = result.scalar_one_or_none()
    if not reading_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reading list not found"
        )
    _check_ownership(reading_list, current_user)

    item_result = await db.execute(
        select(ReadingListItem).where(
            ReadingListItem.reading_list_id == list_id,
            ReadingListItem.resource_id == resource_id,
        )
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found"
        )

    await db.delete(item)
    await db.commit()

    reading_list = await _load_reading_list_detail(db, list_id)
    _check_ownership(reading_list, current_user)
    return ReadingListDetailResponse.model_validate(reading_list)
