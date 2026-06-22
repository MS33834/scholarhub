from datetime import datetime, timezone
import re
import unicodedata
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_admin
from app.core.config import settings
from app.core.limiter import rate_limit
from app.db.session import get_db
from app.models.models import Resource, ResourceSubmission, User
from app.schemas import (
    PaginationMeta,
    ResourceSubmissionCreate,
    ResourceSubmissionListResponse,
    ResourceSubmissionResponse,
    ResourceSubmissionReview,
)

router = APIRouter(prefix="/submissions", tags=["submissions"])

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 200


def _slugify(text: str) -> str:
    """Normalize text to a lowercase ASCII slug."""
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")


async def _generate_resource_id(db: AsyncSession, submission: ResourceSubmission) -> str:
    """Generate a unique slug id for a new Resource based on a submission."""
    first_author = submission.authors[0] if submission.authors else ""
    last_name = first_author.split()[-1] if first_author.split() else "author"
    author_part = _slugify(last_name) or "author"
    title_part = _slugify(submission.title) or "resource"

    base = f"{author_part}-{title_part}-{submission.year}"
    base = base[:80].strip("-")
    candidate = base

    for counter in range(1, 1000):
        existing = await db.execute(select(Resource.id).where(Resource.id == candidate))
        if existing.scalar_one_or_none() is None:
            return candidate
        suffix = f"-{counter}"
        candidate = base[: 100 - len(suffix)] + suffix

    # Fallback to a unique suffix if all candidates collide.
    return f"{base}-{uuid.uuid4().hex[:8]}"[:100]


async def _create_resource_from_submission(
    db: AsyncSession, submission: ResourceSubmission
) -> str:
    """Create a Resource record from an approved submission and return its id."""
    resource_id = await _generate_resource_id(db, submission)
    resource = Resource(
        id=resource_id,
        type=submission.type,
        title=submission.title,
        authors=submission.authors,
        year=submission.year,
        venue=submission.venue or "",
        discipline=submission.discipline,
        subdiscipline=submission.subdiscipline,
        tags=submission.tags,
        abstract=submission.abstract,
        preview=submission.abstract[:200],
        download_url=submission.download_url,
        external_url=submission.external_url,
        doi=submission.doi,
        citation={"apa": "", "mla": "", "gbt": "", "bibtex": ""},
        citations=0,
        added_at=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
    db.add(resource)
    return resource_id


def _submission_to_response(
    submission: ResourceSubmission, username: str
) -> ResourceSubmissionResponse:
    return ResourceSubmissionResponse(
        id=submission.id,
        user_id=submission.user_id,
        username=username,
        title=submission.title,
        type=submission.type,
        authors=submission.authors,
        year=submission.year,
        venue=submission.venue,
        discipline=submission.discipline,
        subdiscipline=submission.subdiscipline,
        tags=submission.tags,
        abstract=submission.abstract,
        download_url=submission.download_url,
        external_url=submission.external_url,
        doi=submission.doi,
        status=submission.status,
        admin_note=submission.admin_note,
        resource_id=submission.resource_id,
        created_at=submission.created_at,
        updated_at=submission.updated_at,
    )


async def _paginate_submissions(
    db: AsyncSession,
    query,
    page: int,
    page_size: int,
    username_map: dict[int, str] | None = None,
) -> ResourceSubmissionListResponse:
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar() or 0

    offset = (page - 1) * page_size
    query = query.order_by(ResourceSubmission.created_at.desc(), ResourceSubmission.id.desc())
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    submissions = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ResourceSubmissionListResponse(
        data=[
            _submission_to_response(
                s, username_map.get(s.user_id, "") if username_map else ""
            )
            for s in submissions
        ],
        meta=PaginationMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ResourceSubmissionResponse)
@rate_limit("10/minute")
async def create_submission(
    request: Request,
    body: ResourceSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    submission = ResourceSubmission(
        user_id=current_user.id,
        status="pending",
        **body.model_dump(),
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return _submission_to_response(submission, current_user.username)


@router.get("/me", response_model=ResourceSubmissionListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def list_my_submissions(
    request: Request,
    status_value: Annotated[
        str | None, Query(alias="status", pattern=r"^(pending|approved|rejected)$")
    ] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(ResourceSubmission).where(ResourceSubmission.user_id == current_user.id)
    if status_value:
        query = query.where(ResourceSubmission.status == status_value)

    username_map = {current_user.id: current_user.username}
    return await _paginate_submissions(db, query, page, page_size, username_map)


@router.get("/", response_model=ResourceSubmissionListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def list_submissions(
    request: Request,
    status_value: Annotated[
        str | None, Query(alias="status", pattern=r"^(pending|approved|rejected)$")
    ] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(ResourceSubmission).options(selectinload(ResourceSubmission.user))
    if status_value:
        query = query.where(ResourceSubmission.status == status_value)

    result = await db.execute(select(User.id, User.username))
    username_map = {row[0]: row[1] for row in result.all()}

    return await _paginate_submissions(db, query, page, page_size, username_map)


@router.get("/{submission_id}", response_model=ResourceSubmissionResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_submission(
    request: Request,
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResourceSubmission)
        .options(selectinload(ResourceSubmission.user), selectinload(ResourceSubmission.resource))
        .where(ResourceSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    if not current_user.is_admin and submission.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    username = submission.user.username if submission.user else ""
    return _submission_to_response(submission, username)


@router.patch("/{submission_id}", response_model=ResourceSubmissionResponse)
@rate_limit("30/minute")
async def review_submission(
    request: Request,
    submission_id: int,
    body: ResourceSubmissionReview,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResourceSubmission)
        .options(selectinload(ResourceSubmission.user))
        .where(ResourceSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    updates = body.model_dump(exclude_unset=True)

    if updates.get("status") == "approved":
        resource_id = updates.get("resource_id") or submission.resource_id
        if resource_id:
            existing = await db.execute(select(Resource.id).where(Resource.id == resource_id))
            if existing.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Provided resource_id does not exist",
                )
            updates["resource_id"] = resource_id
        else:
            updates["resource_id"] = await _create_resource_from_submission(db, submission)

    for key, value in updates.items():
        setattr(submission, key, value)

    await db.commit()
    await db.refresh(submission)

    username = submission.user.username if submission.user else ""
    return _submission_to_response(submission, username)
