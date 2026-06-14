from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    type: Mapped[str] = mapped_column(String(50), index=True)  # paper, book, dataset, tutorial
    title: Mapped[str] = mapped_column(Text)
    authors: Mapped[list] = mapped_column(JSON)
    year: Mapped[int] = mapped_column(Integer, index=True)
    venue: Mapped[str] = mapped_column(Text)
    discipline: Mapped[str] = mapped_column(String(100), index=True)
    subdiscipline: Mapped[str | None] = mapped_column(String(100))
    tags: Mapped[list] = mapped_column(JSON)
    abstract: Mapped[str] = mapped_column(Text)
    preview: Mapped[str] = mapped_column(Text)
    download_url: Mapped[str | None] = mapped_column(String(500))
    external_url: Mapped[str | None] = mapped_column(String(500))
    doi: Mapped[str | None] = mapped_column(String(200))
    citation: Mapped[dict] = mapped_column(JSON)
    citations: Mapped[int | None] = mapped_column(Integer, default=0)
    added_at: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class Favorite(Base):
    __tablename__ = "favorites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    resource_id: Mapped[str] = mapped_column(String(100), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ReadingHistory(Base):
    __tablename__ = "reading_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    resource_id: Mapped[str] = mapped_column(String(100), index=True)
    viewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
