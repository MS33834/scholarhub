"""Make venue nullable and add submission review fields

Revision ID: 004_make_venue_nullable_and_add_review_fields
Revises: 003_add_resource_submissions
Create Date: 2026-06-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "004_make_venue_nullable_and_add_review_fields"
down_revision: Union[str, None] = "003_add_resource_submissions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Allow resources to be created without a venue (e.g. from user submissions).
    op.alter_column("resources", "venue", existing_type=sa.Text(), nullable=True)

    # Track who reviewed a submission and when.
    op.add_column(
        "resource_submissions",
        sa.Column("reviewed_by_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "resource_submissions",
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_resource_submissions_reviewed_by_id",
        "resource_submissions",
        "users",
        ["reviewed_by_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_resource_submissions_reviewed_by_id", "resource_submissions", type_="foreignkey"
    )
    op.drop_column("resource_submissions", "reviewed_at")
    op.drop_column("resource_submissions", "reviewed_by_id")
    op.alter_column("resources", "venue", existing_type=sa.Text(), nullable=False)
