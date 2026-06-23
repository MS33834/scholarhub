"""Add resource_submissions table

Revision ID: 003_add_resource_submissions
Revises: 002_add_fk_and_unique_constraints
Create Date: 2026-06-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003_add_resource_submissions"
down_revision: Union[str, None] = "002_fk_unique_constraints"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resource_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("authors", sa.JSON(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("venue", sa.Text(), nullable=True),
        sa.Column("discipline", sa.String(length=100), nullable=False),
        sa.Column("subdiscipline", sa.String(length=100), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("abstract", sa.Text(), nullable=False),
        sa.Column("download_url", sa.String(length=500), nullable=True),
        sa.Column("external_url", sa.String(length=500), nullable=True),
        sa.Column("doi", sa.String(length=200), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("resource_id", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="SET NULL"),
    )
    op.create_index(
        "ix_resource_submissions_user_id", "resource_submissions", ["user_id"], unique=False
    )
    op.create_index(
        "ix_resource_submissions_status", "resource_submissions", ["status"], unique=False
    )
    op.create_index(
        "ix_resource_submissions_resource_id",
        "resource_submissions",
        ["resource_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("resource_submissions")
