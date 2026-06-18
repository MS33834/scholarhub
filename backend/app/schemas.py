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
    is_active: bool
    is_admin: bool


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


class ResourceBase(CamelBaseModel):
    id: str = Field(..., max_length=100)
    type: str = Field(..., pattern=r"^(paper|book|dataset|tutorial)$")
    title: str
    authors: list[str]
    year: int = Field(..., ge=1000, le=2100)
    venue: str | None = None
    discipline: str
    subdiscipline: str | None = None
    tags: list[str] = Field(default_factory=list)
    abstract: str
    preview: str
    download_url: str | None = Field(None, max_length=500)
    external_url: str | None = Field(None, max_length=500)
    doi: str | None = Field(None, max_length=200)
    citation: Citation
    citations: int | None = Field(None, ge=0)
    added_at: str | None = None


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(CamelBaseModel):
    type: str | None = Field(None, pattern=r"^(paper|book|dataset|tutorial)$")
    title: str | None = None
    authors: list[str] | None = None
    year: int | None = Field(None, ge=1000, le=2100)
    venue: str | None = None
    discipline: str | None = None
    subdiscipline: str | None = None
    tags: list[str] | None = None
    abstract: str | None = None
    preview: str | None = None
    download_url: str | None = Field(None, max_length=500)
    external_url: str | None = Field(None, max_length=500)
    doi: str | None = Field(None, max_length=200)
    citation: Citation | None = None
    citations: int | None = Field(None, ge=0)
    added_at: str | None = None


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
