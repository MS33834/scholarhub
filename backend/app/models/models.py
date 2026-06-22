from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


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

    favorites: Mapped[list["Favorite"]] = relationship(
        "Favorite", back_populates="user", cascade="all, delete-orphan"
    )
    reading_history: Mapped[list["ReadingHistory"]] = relationship(
        "ReadingHistory", back_populates="user", cascade="all, delete-orphan"
    )
    submissions: Mapped[list["ResourceSubmission"]] = relationship(
        "ResourceSubmission",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="ResourceSubmission.user_id",
    )


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    type: Mapped[str] = mapped_column(String(50), index=True)  # paper, book, dataset, tutorial
    title: Mapped[str] = mapped_column(Text)
    authors: Mapped[list] = mapped_column(JSON)
    year: Mapped[int] = mapped_column(Integer, index=True)
    venue: Mapped[str | None] = mapped_column(Text)
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

    favorites: Mapped[list["Favorite"]] = relationship(
        "Favorite", back_populates="resource", cascade="all, delete-orphan"
    )
    reading_history: Mapped[list["ReadingHistory"]] = relationship(
        "ReadingHistory", back_populates="resource", cascade="all, delete-orphan"
    )
    submissions: Mapped[list["ResourceSubmission"]] = relationship(
        "ResourceSubmission", back_populates="resource"
    )


class Favorite(Base):
    __tablename__ = "favorites"

    __table_args__ = (
        UniqueConstraint("user_id", "resource_id", name="uix_user_resource_favorite"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    resource_id: Mapped[str] = mapped_column(
        ForeignKey("resources.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    resource: Mapped["Resource"] = relationship("Resource", back_populates="favorites")


class ReadingHistory(Base):
    __tablename__ = "reading_history"

    __table_args__ = (UniqueConstraint("user_id", "resource_id", name="uix_user_resource_history"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    resource_id: Mapped[str] = mapped_column(
        ForeignKey("resources.id", ondelete="CASCADE"), index=True
    )
    viewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="reading_history")
    resource: Mapped["Resource"] = relationship("Resource", back_populates="reading_history")


class ResourceSubmission(Base):
    __tablename__ = "resource_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(50))
    authors: Mapped[list] = mapped_column(JSON)
    year: Mapped[int] = mapped_column(Integer)
    venue: Mapped[str | None] = mapped_column(Text)
    discipline: Mapped[str] = mapped_column(String(100))
    subdiscipline: Mapped[str | None] = mapped_column(String(100))
    tags: Mapped[list] = mapped_column(JSON)
    abstract: Mapped[str] = mapped_column(Text)
    download_url: Mapped[str | None] = mapped_column(String(500))
    external_url: Mapped[str | None] = mapped_column(String(500))
    doi: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(
        String(20), default="pending", index=True
    )
    admin_note: Mapped[str | None] = mapped_column(Text)
    resource_id: Mapped[str | None] = mapped_column(
        ForeignKey("resources.id", ondelete="SET NULL")
    )
    reviewed_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship(
        "User", back_populates="submissions", foreign_keys="ResourceSubmission.user_id"
    )
    resource: Mapped["Resource"] = relationship("Resource", back_populates="submissions")
    reviewer: Mapped["User | None"] = relationship(
        "User", foreign_keys="ResourceSubmission.reviewed_by_id"
    )
