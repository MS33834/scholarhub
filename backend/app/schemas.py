"""Pydantic schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# Resource ID pattern: alphanumeric start, then alphanumeric/dot/dash/underscore.
# Prevents path traversal (/, \, ..), SQL metacharacters, and whitespace.
_RESOURCE_ID_PATTERN = r"^[a-zA-Z0-9][a-zA-Z0-9._-]*$"

# Tag pattern: alphanumeric or CJK start, then word chars/spaces/dash/dot.
# Prevents control characters, angle brackets, and quotes.
_TAG_PATTERN = r"^[^\s<>\"'&\\]+$"
_TAG_MAX_LENGTH = 50
_AUTHOR_MAX_LENGTH = 200


def _validate_resource_id(value: str) -> str:
    if not value or len(value) > 100:
        return value  # length handled by Field(max_length=...)
    import re

    if not re.match(_RESOURCE_ID_PATTERN, value):
        raise ValueError(
            "Resource ID must start with an alphanumeric character and contain only "
            "letters, digits, dots, dashes, and underscores."
        )
    return value


def _validate_discipline(value: str) -> str:
    """Validate that the discipline slug exists in the canonical catalog."""
    from app.api.disciplines import DISCIPLINES

    valid_slugs = {d["slug"] for d in DISCIPLINES}
    if value not in valid_slugs:
        raise ValueError(
            f"Invalid discipline '{value}'. Must be one of: {', '.join(sorted(valid_slugs))}"
        )
    return value


def _validate_tags(tags: list[str]) -> list[str]:
    for tag in tags:
        if not tag:
            raise ValueError("Tags must not be empty strings.")
        if len(tag) > _TAG_MAX_LENGTH:
            raise ValueError(f"Each tag must be at most {_TAG_MAX_LENGTH} characters long.")
        import re

        if not re.match(_TAG_PATTERN, tag):
            raise ValueError(
                "Tags must not contain angle brackets, quotes, ampersands, or backslashes."
            )
    return tags


def _validate_authors(authors: list[str]) -> list[str]:
    for author in authors:
        if not author or not author.strip():
            raise ValueError("Author names must not be empty.")
        if len(author) > _AUTHOR_MAX_LENGTH:
            raise ValueError(f"Each author name must be at most {_AUTHOR_MAX_LENGTH} characters long.")
    return authors


def _validate_url(value: str | None) -> str | None:
    """Validate that URL fields use http or https scheme (or are None)."""
    if value is None:
        return value
    lowered = value.strip().lower()
    if not lowered.startswith(("http://", "https://")):
        raise ValueError("URL must start with http:// or https://")
    return value


def _to_camel(snake: str) -> str:
    """Convert snake_case to camelCase."""
    parts = snake.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class CamelBaseModel(BaseModel):
    """Base model that exposes camelCase aliases for the frontend while
    accepting snake_case from Python/server-side code.
    """

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=_to_camel,
    )


class UserBase(CamelBaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=_to_camel
    )

    id: int
    # Use plain str for responses so local/development addresses such as
    # admin@scholarhub.local do not fail strict EmailStr validation.
    email: str
    is_active: bool
    is_admin: bool


class UserUpdate(CamelBaseModel):
    is_active: bool | None = None
    is_admin: bool | None = None


class UserBrief(CamelBaseModel):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=_to_camel
    )

    id: int
    username: str


class UserLogin(CamelBaseModel):
    username: str
    password: str


class TokenResponse(CamelBaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    is_admin: bool


class RefreshTokenRequest(CamelBaseModel):
    refresh_token: str


class Citation(CamelBaseModel):
    apa: str
    mla: str
    gbt: str
    bibtex: str
    authors: list[str] | None = None


class ResourceBase(CamelBaseModel):
    id: str = Field(..., max_length=100)
    type: str = Field(..., pattern=r"^(paper|book|dataset|tutorial)$")
    title: str = Field(..., max_length=1000)
    authors: list[str] = Field(..., max_length=200)
    year: int = Field(..., ge=-3000, le=2100)
    venue: str | None = Field(None, max_length=500)
    discipline: str = Field(..., max_length=100)
    subdiscipline: str | None = Field(None, max_length=100)
    tags: list[str] = Field(default_factory=list, max_length=50)
    abstract: str = Field(..., max_length=20000)
    preview: str = Field(..., max_length=5000)
    download_url: str | None = Field(None, max_length=500)
    external_url: str | None = Field(None, max_length=500)
    doi: str | None = Field(None, max_length=200)
    citation: Citation
    citations: int | None = Field(None, ge=0)
    added_at: str | None = Field(None, max_length=20)

    _validate_id = field_validator("id")(_validate_resource_id)
    _validate_discipline = field_validator("discipline")(_validate_discipline)
    _validate_tags = field_validator("tags")(_validate_tags)
    _validate_authors = field_validator("authors")(_validate_authors)
    _validate_download_url = field_validator("download_url")(_validate_url)
    _validate_external_url = field_validator("external_url")(_validate_url)


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(CamelBaseModel):
    type: str | None = Field(None, pattern=r"^(paper|book|dataset|tutorial)$")
    title: str | None = Field(None, max_length=1000)
    authors: list[str] | None = Field(None, max_length=200)
    year: int | None = Field(None, ge=-3000, le=2100)
    venue: str | None = Field(None, max_length=500)
    discipline: str | None = Field(None, max_length=100)
    subdiscipline: str | None = Field(None, max_length=100)
    tags: list[str] | None = Field(None, max_length=50)
    abstract: str | None = Field(None, max_length=20000)
    preview: str | None = Field(None, max_length=5000)
    download_url: str | None = Field(None, max_length=500)
    external_url: str | None = Field(None, max_length=500)
    doi: str | None = Field(None, max_length=200)
    citation: Citation | None = None
    citations: int | None = Field(None, ge=0)
    added_at: str | None = Field(None, max_length=20)

    _validate_discipline = field_validator("discipline")(_validate_discipline)
    _validate_tags = field_validator("tags")(_validate_tags)
    _validate_authors = field_validator("authors")(_validate_authors)
    _validate_download_url = field_validator("download_url")(_validate_url)
    _validate_external_url = field_validator("external_url")(_validate_url)


class ResourceResponse(ResourceBase):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=_to_camel
    )

    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginationMeta(CamelBaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class ResourceListResponse(CamelBaseModel):
    data: list[ResourceResponse]
    meta: PaginationMeta


class ResourceRelatedResponse(CamelBaseModel):
    data: list[ResourceResponse]


class UserListResponse(CamelBaseModel):
    data: list[UserResponse]
    meta: PaginationMeta


class ResourceStats(CamelBaseModel):
    total: int
    by_type: dict[str, int]
    by_discipline: dict[str, int]


class DisciplineResponse(CamelBaseModel):
    slug: str
    name: str
    name_en: str
    description: str
    resource_count: int = 0


class DisciplineListResponse(CamelBaseModel):
    data: list[DisciplineResponse]


class FavoriteCreateResponse(CamelBaseModel):
    message: str


class FavoriteListResponse(CamelBaseModel):
    favorites: list[ResourceResponse]


class HistoryCreateResponse(CamelBaseModel):
    message: str


class HistoryEntryResponse(CamelBaseModel):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=_to_camel
    )

    resource: ResourceResponse
    viewed_at: datetime


class HistoryListResponse(CamelBaseModel):
    history: list[HistoryEntryResponse]


class ResourceSubmissionCreate(CamelBaseModel):
    title: str = Field(..., max_length=1000)
    type: str = Field(..., pattern=r"^(paper|book|dataset|tutorial)$")
    authors: list[str] = Field(..., max_length=200)
    year: int = Field(..., ge=-3000, le=2100)
    venue: str | None = Field(None, max_length=500)
    discipline: str = Field(..., max_length=100)
    subdiscipline: str | None = Field(None, max_length=100)
    tags: list[str] = Field(default_factory=list, max_length=50)
    abstract: str = Field(..., max_length=20000)
    download_url: str | None = Field(None, max_length=500)
    external_url: str | None = Field(None, max_length=500)
    doi: str | None = Field(None, max_length=200)

    _validate_discipline = field_validator("discipline")(_validate_discipline)
    _validate_tags = field_validator("tags")(_validate_tags)
    _validate_authors = field_validator("authors")(_validate_authors)
    _validate_download_url = field_validator("download_url")(_validate_url)
    _validate_external_url = field_validator("external_url")(_validate_url)


class ResourceSubmissionReview(CamelBaseModel):
    status: str = Field(..., pattern=r"^(pending|approved|rejected)$")
    admin_note: str | None = None
    resource_id: str | None = Field(None, max_length=100)


class ResourceSubmissionResponse(CamelBaseModel):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=_to_camel
    )

    id: str
    title: str
    type: str
    authors: list[str]
    year: int
    venue: str | None
    discipline: str
    subdiscipline: str | None
    tags: list[str]
    abstract: str
    download_url: str | None
    external_url: str | None
    doi: str | None
    status: str
    admin_note: str | None
    resource_id: str | None
    submitted_by: UserBrief
    submitted_at: datetime
    reviewed_by: UserBrief | None
    reviewed_at: datetime | None


class ResourceSubmissionListResponse(CamelBaseModel):
    data: list[ResourceSubmissionResponse]
    meta: PaginationMeta


class ReadingListCreate(CamelBaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    is_public: bool = False


class ReadingListUpdate(CamelBaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    is_public: bool | None = None


class ReadingListItemCreate(CamelBaseModel):
    resource_id: str = Field(..., min_length=1, max_length=100)


class ReadingListResponse(CamelBaseModel):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=_to_camel
    )

    id: int
    name: str
    description: str | None
    is_public: bool
    item_count: int = 0
    created_at: datetime
    updated_at: datetime


class ReadingListItemResponse(CamelBaseModel):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=_to_camel
    )

    resource: ResourceResponse
    added_at: datetime


class ReadingListDetailResponse(CamelBaseModel):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=_to_camel
    )

    id: int
    name: str
    description: str | None
    is_public: bool
    item_count: int = 0
    created_at: datetime
    updated_at: datetime
    items: list[ReadingListItemResponse]


class ReadingListListResponse(CamelBaseModel):
    data: list[ReadingListDetailResponse]


class ReadingListAddItemResponse(CamelBaseModel):
    message: str
