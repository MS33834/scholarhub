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
    ReadingListAddItemResponse,
    ReadingListCreate,
    ReadingListDetailResponse,
    ReadingListItemCreate,
    ReadingListListResponse,
    ReadingListResponse,
    ReadingListUpdate,
)

router = APIRouter(prefix="/reading-lists", tags=["reading-lists"])


def _check_ownership(reading_list: ReadingList, current_user: User) -> None:
    if reading_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )


@router.get("/", response_model=ReadingListListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def list_reading_lists(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item_count_subq = (
        select(func.count(ReadingListItem.id))
        .where(ReadingListItem.reading_list_id == ReadingList.id)
        .correlate(ReadingList)
        .scalar_subquery()
    )

    result = await db.execute(
        select(ReadingList, item_count_subq.label("item_count"))
        .where(ReadingList.user_id == current_user.id)
        .order_by(ReadingList.created_at.desc())
    )

    data = []
    for reading_list, count in result.all():
        data.append(
            ReadingListResponse.model_validate(reading_list).model_copy(
                update={"item_count": count}
            )
        )
    return ReadingListListResponse(data=data)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ReadingListResponse)
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
    return ReadingListResponse.model_validate(reading_list).model_copy(
        update={"item_count": 0}
    )


@router.get("/{list_id}", response_model=ReadingListDetailResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_reading_list(
    request: Request,
    list_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReadingList)
        .options(
            selectinload(ReadingList.items).selectinload(ReadingListItem.resource)
        )
        .where(ReadingList.id == list_id)
    )
    reading_list = result.scalar_one_or_none()
    if not reading_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reading list not found"
        )
    _check_ownership(reading_list, current_user)

    reading_list.items = sorted(reading_list.items, key=lambda item: item.added_at)
    return ReadingListDetailResponse.model_validate(reading_list)


@router.patch("/{list_id}", response_model=ReadingListResponse)
@rate_limit("30/minute")
async def update_reading_list(
    request: Request,
    list_id: int,
    payload: ReadingListUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReadingList)
        .where(ReadingList.id == list_id)
    )
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
    await db.refresh(reading_list)

    item_count_result = await db.execute(
        select(func.count(ReadingListItem.id)).where(
            ReadingListItem.reading_list_id == reading_list.id
        )
    )
    item_count = item_count_result.scalar() or 0
    return ReadingListResponse.model_validate(reading_list).model_copy(
        update={"item_count": item_count}
    )


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
    response_model=ReadingListAddItemResponse,
)
@rate_limit("30/minute")
async def add_item_to_reading_list(
    request: Request,
    list_id: int,
    payload: ReadingListItemCreate,
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
        return ReadingListAddItemResponse(message="Resource already in reading list")

    item = ReadingListItem(
        reading_list_id=list_id, resource_id=payload.resource_id
    )
    db.add(item)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return ReadingListAddItemResponse(message="Resource already in reading list")
    return ReadingListAddItemResponse(message="Resource added to reading list")


@router.delete(
    "/{list_id}/items/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@rate_limit("30/minute")
async def remove_item_from_reading_list(
    request: Request,
    list_id: int,
    resource_id: str,
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
