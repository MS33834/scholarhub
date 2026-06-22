"""Add FK and unique constraints to favorites and reading_history

Revision ID: 002_add_fk_and_unique_constraints
Revises: 001_initial_schema
Create Date: 2026-06-21 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002_add_fk_and_unique_constraints"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _recreate_favorites(with_constraints: bool) -> None:
    """Recreate the favorites table, optionally with FK/unique constraints."""
    table_name = "favorites_new" if with_constraints else "favorites_old"
    constraints = []
    if with_constraints:
        constraints.extend(
            [
                sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
                sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
                sa.UniqueConstraint("user_id", "resource_id", name="uix_user_resource_favorite"),
            ]
        )

    op.create_table(
        table_name,
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("resource_id", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        *constraints,
    )
    op.create_index(f"ix_{table_name}_resource_id", table_name, ["resource_id"], unique=False)
    op.create_index(f"ix_{table_name}_user_id", table_name, ["user_id"], unique=False)


def _recreate_reading_history(with_constraints: bool) -> None:
    """Recreate the reading_history table, optionally with FK/unique constraints."""
    table_name = "reading_history_new" if with_constraints else "reading_history_old"
    constraints = []
    if with_constraints:
        constraints.extend(
            [
                sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
                sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
                sa.UniqueConstraint("user_id", "resource_id", name="uix_user_resource_history"),
            ]
        )

    op.create_table(
        table_name,
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("resource_id", sa.String(length=100), nullable=False),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        *constraints,
    )
    op.create_index(f"ix_{table_name}_resource_id", table_name, ["resource_id"], unique=False)
    op.create_index(f"ix_{table_name}_user_id", table_name, ["user_id"], unique=False)


def upgrade() -> None:
    dialect = op.get_context().dialect.name

    if dialect == "sqlite":
        # SQLite supports only limited ALTER TABLE; recreate tables.
        _recreate_favorites(with_constraints=True)
        op.execute(
            "INSERT INTO favorites_new (id, user_id, resource_id, created_at) "
            "SELECT id, user_id, resource_id, created_at FROM favorites"
        )
        op.drop_table("favorites")
        op.rename_table("favorites_new", "favorites")

        _recreate_reading_history(with_constraints=True)
        op.execute(
            "INSERT INTO reading_history_new (id, user_id, resource_id, viewed_at) "
            "SELECT id, user_id, resource_id, viewed_at FROM reading_history"
        )
        op.drop_table("reading_history")
        op.rename_table("reading_history_new", "reading_history")
    else:
        op.create_foreign_key(
            "fk_favorites_user_id",
            "favorites",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_foreign_key(
            "fk_favorites_resource_id",
            "favorites",
            "resources",
            ["resource_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_unique_constraint(
            "uix_user_resource_favorite", "favorites", ["user_id", "resource_id"]
        )

        op.create_foreign_key(
            "fk_reading_history_user_id",
            "reading_history",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_foreign_key(
            "fk_reading_history_resource_id",
            "reading_history",
            "resources",
            ["resource_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_unique_constraint(
            "uix_user_resource_history",
            "reading_history",
            ["user_id", "resource_id"],
        )


def downgrade() -> None:
    dialect = op.get_context().dialect.name

    if dialect == "sqlite":
        _recreate_favorites(with_constraints=False)
        op.execute(
            "INSERT INTO favorites_old (id, user_id, resource_id, created_at) "
            "SELECT id, user_id, resource_id, created_at FROM favorites"
        )
        op.drop_table("favorites")
        op.rename_table("favorites_old", "favorites")

        _recreate_reading_history(with_constraints=False)
        op.execute(
            "INSERT INTO reading_history_old (id, user_id, resource_id, viewed_at) "
            "SELECT id, user_id, resource_id, viewed_at FROM reading_history"
        )
        op.drop_table("reading_history")
        op.rename_table("reading_history_old", "reading_history")
    else:
        op.drop_constraint("uix_user_resource_favorite", "favorites", type_="unique")
        op.drop_constraint("fk_favorites_resource_id", "favorites", type_="foreignkey")
        op.drop_constraint("fk_favorites_user_id", "favorites", type_="foreignkey")

        op.drop_constraint("uix_user_resource_history", "reading_history", type_="unique")
        op.drop_constraint("fk_reading_history_resource_id", "reading_history", type_="foreignkey")
        op.drop_constraint("fk_reading_history_user_id", "reading_history", type_="foreignkey")
