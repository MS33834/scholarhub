from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import String, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.config import settings
from app.core.limiter import rate_limit
from app.db.session import get_db
from app.models.models import Resource, User
from app.schemas import (
    PaginationMeta,
    ResourceCreate,
    ResourceListResponse,
    ResourceResponse,
    ResourceStats,
    ResourceUpdate,
)

router = APIRouter(prefix="/resources", tags=["resources"])

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 200
DEFAULT_SORT = "added_at"


def _apply_sort(query, sort: str | None, order: str | None):
    """Apply ordering to keep pagination deterministic."""
    sort_column = getattr(Resource, sort or DEFAULT_SORT, Resource.added_at)
    if order == "desc":
        return query.order_by(sort_column.desc(), Resource.id.asc())
    return query.order_by(sort_column.asc(), Resource.id.asc())


@router.get("/", response_model=ResourceListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def list_resources(
    request: Request,
    ids: Annotated[list[str] | None, Query()] = None,
    type: str | None = None,
    discipline: str | None = None,
    year: int | None = None,
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    limit: int | None = Query(default=None, ge=1, le=MAX_PAGE_SIZE),
    sort: str | None = Query(default=None, pattern=r"^(year|title|citations|added_at)$"),
    order: str | None = Query(default=None, pattern=r"^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Resource)

    if ids:
        query = query.where(Resource.id.in_(ids))
    if type:
        query = query.where(Resource.type == type)
    if discipline:
        query = query.where(Resource.discipline == discipline)
    if year:
        query = query.where(Resource.year == year)
    if q:
        search = f"%{q}%"
        query = query.where(
            Resource.title.ilike(search)
            | Resource.abstract.ilike(search)
            | Resource.tags.cast(String).ilike(search)
        )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    query = _apply_sort(query, sort, order)

    # When `limit` is provided and the caller did not override pagination,
    # return the first N items as a single page.
    using_top_n = limit is not None and page_size == DEFAULT_PAGE_SIZE and page == 1
    if using_top_n:
        effective_page_size = min(limit, MAX_PAGE_SIZE)
        query = query.limit(effective_page_size)
        total_pages = 1 if total > 0 else 0
        current_page = 1
    else:
        effective_page_size = page_size
        offset = (page - 1) * effective_page_size
        query = query.offset(offset).limit(effective_page_size)
        total_pages = (total + effective_page_size - 1) // effective_page_size
        current_page = page

    result = await db.execute(query)
    resources = result.scalars().all()

    return ResourceListResponse(
        data=[ResourceResponse.model_validate(r) for r in resources],
        meta=PaginationMeta(
            total=total,
            page=current_page,
            page_size=effective_page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/stats", response_model=ResourceStats)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_resource_stats(request: Request, db: AsyncSession = Depends(get_db)):
    total_result = await db.execute(select(func.count()).select_from(Resource))
    total = total_result.scalar() or 0

    type_result = await db.execute(select(Resource.type, func.count()).group_by(Resource.type))
    by_type = {row[0]: row[1] for row in type_result.all()}

    discipline_result = await db.execute(
        select(Resource.discipline, func.count()).group_by(Resource.discipline)
    )
    by_discipline = {row[0]: row[1] for row in discipline_result.all()}

    return ResourceStats(total=total, by_type=by_type, by_discipline=by_discipline)


@router.get("/{resource_id}", response_model=ResourceResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_resource(request: Request, resource_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return ResourceResponse.model_validate(resource)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ResourceResponse)
@rate_limit("30/minute")
async def create_resource(
    request: Request,
    resource: ResourceCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Resource).where(Resource.id == resource.id))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resource with this id already exists",
        )

    new_resource = Resource(**resource.model_dump())
    db.add(new_resource)
    await db.commit()
    await db.refresh(new_resource)
    return ResourceResponse.model_validate(new_resource)


@router.put("/{resource_id}", response_model=ResourceResponse)
@rate_limit("30/minute")
async def update_resource(
    request: Request,
    resource_id: str,
    updates: ResourceUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(resource, key, value)

    await db.commit()
    await db.refresh(resource)
    return ResourceResponse.model_validate(resource)


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit("30/minute")
async def delete_resource(
    request: Request,
    resource_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    await db.delete(resource)
    await db.commit()
