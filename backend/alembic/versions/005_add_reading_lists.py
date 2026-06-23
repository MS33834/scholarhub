"""Add reading_lists and reading_list_items tables

Revision ID: 005_add_reading_lists
Revises: 004_make_venue_nullable_and_add_review_fields
Create Date: 2026-06-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "005_add_reading_lists"
down_revision: Union[str, None] = "004_venue_nullable_review_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reading_lists",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_reading_lists_user_id", "reading_lists", ["user_id"], unique=False
    )

    op.create_table(
        "reading_list_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reading_list_id", sa.Integer(), nullable=False),
        sa.Column("resource_id", sa.String(length=100), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["reading_list_id"], ["reading_lists.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "reading_list_id", "resource_id", name="uix_reading_list_resource"
        ),
    )
    op.create_index(
        "ix_reading_list_items_reading_list_id",
        "reading_list_items",
        ["reading_list_id"],
        unique=False,
    )
    op.create_index(
        "ix_reading_list_items_resource_id",
        "reading_list_items",
        ["resource_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("reading_list_items")
    op.drop_table("reading_lists")
