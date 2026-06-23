"""Pydantic schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
