"""Add admin market settings and durable virtual accounts."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b614fe903a22"
down_revision = "9404acc3bc9d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    json_type = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")
    op.add_column("exchanges", sa.Column("market_settings", json_type, nullable=True))
    op.create_table(
        "demo_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("source_key", sa.String(160), nullable=False),
        sa.Column("snapshot", json_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "source_key", name="uq_demo_account_source"),
    )
    op.create_index("ix_demo_accounts_user_id", "demo_accounts", ["user_id"])
    op.create_index("ix_demo_accounts_source_key", "demo_accounts", ["source_key"])


def downgrade() -> None:
    op.drop_table("demo_accounts")
    op.drop_column("exchanges", "market_settings")
