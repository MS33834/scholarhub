from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import String, Text, func, or_, select
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
    ResourceRelatedResponse,
    ResourceResponse,
    ResourceStats,
    ResourceUpdate,
)

router = APIRouter(prefix="/resources", tags=["resources"])

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 200
DEFAULT_SORT = "added_at"

RELATED_MAX_LIMIT = 10


def _apply_sort(
    query,
    sort: str | None,
    order: str | None,
    relevance_column=None,
    relevance_available: bool = False,
):
    """Apply ordering to keep pagination deterministic.

    When ``relevance_available`` is True and the caller either explicitly
    requests ``sort=relevance`` or leaves ``sort`` unspecified during a
    search, results are ordered by the provided relevance expression.
    """
    sort_by_relevance = (sort == "relevance" or sort is None) and relevance_available
    if sort_by_relevance and relevance_column is not None:
        if order == "asc":
            return query.order_by(relevance_column.asc(), Resource.id.asc())
        return query.order_by(relevance_column.desc(), Resource.id.asc())
    sort_column = getattr(Resource, sort or DEFAULT_SORT, Resource.added_at)
    if order == "desc":
        return query.order_by(sort_column.desc(), Resource.id.asc())
    return query.order_by(sort_column.asc(), Resource.id.asc())


def _is_postgresql(db: AsyncSession) -> bool:
    return db.bind is not None and db.bind.dialect.name == "postgresql"


def _search_vector():
    """Return a PostgreSQL tsvector covering title, abstract and tags."""
    return func.to_tsvector(
        "english",
        func.concat_ws(
            " ",
            func.coalesce(Resource.title, ""),
            func.coalesce(Resource.abstract, ""),
            func.coalesce(func.cast(Resource.tags, Text), ""),
        ),
    )


def _author_set(resource: Resource) -> set[str]:
    """Return the union of authors from both the authors field and citation.authors."""
    authors: set[str] = set(resource.authors or [])
    citation = resource.citation
    if isinstance(citation, dict):
        citation_authors = citation.get("authors")
        if isinstance(citation_authors, list):
            authors.update(str(author) for author in citation_authors)
    return authors


@router.get("/", response_model=ResourceListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def list_resources(
    request: Request,
    ids: Annotated[list[str] | None, Query()] = None,
    type: str | None = None,
    discipline: str | None = None,
    year: int | None = None,
    tags: Annotated[list[str] | None, Query()] = None,
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    limit: int | None = Query(default=None, ge=1, le=MAX_PAGE_SIZE),
    sort: str | None = Query(default=None, pattern=r"^(year|title|citations|added_at|relevance)$"),
    order: str | None = Query(default=None, pattern=r"^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Resource)

    filters = []
    if ids:
        filters.append(Resource.id.in_(ids))
    if type:
        filters.append(Resource.type == type)
    if discipline:
        filters.append(Resource.discipline == discipline)
    if year:
        filters.append(Resource.year == year)
    if tags:
        for tag in tags:
            filters.append(Resource.tags.cast(Text).ilike(f"%{tag}%"))

    rank = None
    relevance_available = False
    search_filter = None
    if q:
        if _is_postgresql(db):
            tsv = _search_vector()
            tsq = func.plainto_tsquery("english", q)
            rank = func.ts_rank_cd(tsv, tsq).label("rank")
            search_filter = tsv.op("@@")(tsq)
            query = query.add_columns(rank)
            relevance_available = True
        else:
            search = f"%{q}%"
            search_filter = (
                Resource.title.ilike(search)
                | Resource.abstract.ilike(search)
                | Resource.tags.cast(String).ilike(search)
            )

    if filters or search_filter is not None:
        all_filters = filters.copy()
        if search_filter is not None:
            all_filters.append(search_filter)
        query = query.where(*all_filters)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    # Demo or sparse data may not match PostgreSQL stemming; fall back to ILIKE.
    if q and _is_postgresql(db) and total == 0:
        search = f"%{q}%"
        search_filter = (
            Resource.title.ilike(search)
            | Resource.abstract.ilike(search)
            | Resource.tags.cast(String).ilike(search)
        )
        query = select(Resource).where(*filters, search_filter)
        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar() or 0
        rank = None
        relevance_available = False

    query = _apply_sort(
        query,
        sort,
        order,
        relevance_column=rank,
        relevance_available=relevance_available,
    )

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


@router.get("/{resource_id}/related", response_model=ResourceRelatedResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_related_resources(
    request: Request,
    resource_id: str,
    limit: int = Query(default=RELATED_MAX_LIMIT, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    target_authors = _author_set(target)
    target_tags = set(target.tags or [])

    # Build a broad, database-agnostic filter that captures any resource
    # sharing a discipline, tag, or author (including citation.authors).
    # False positives are removed by the precise Python scoring below.
    conditions: list = [Resource.discipline == target.discipline]
    for tag in target_tags:
        conditions.append(Resource.tags.cast(String).ilike(f"%{tag}%"))
    for author in target_authors:
        conditions.append(Resource.authors.cast(String).ilike(f"%{author}%"))
        conditions.append(Resource.citation.cast(String).ilike(f"%{author}%"))

    result = await db.execute(select(Resource).where(Resource.id != resource_id, or_(*conditions)))
    candidates = result.scalars().all()

    def _score(resource: Resource) -> int:
        score = 0
        author_overlap = len(_author_set(resource) & target_authors)
        if author_overlap:
            score += author_overlap * 100
        tag_overlap = len(set(resource.tags or []) & target_tags)
        if tag_overlap:
            score += tag_overlap * 10
        if resource.discipline == target.discipline:
            score += 1
        return score

    scored = [(resource, _score(resource)) for resource in candidates if _score(resource) > 0]
    scored.sort(key=lambda item: (-item[1], item[0].id))

    top = scored[:limit]
    return ResourceRelatedResponse(
        data=[ResourceResponse.model_validate(resource) for resource, _ in top]
    )


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
