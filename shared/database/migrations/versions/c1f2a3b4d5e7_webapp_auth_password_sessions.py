"""webapp_auth: add password fields and user_sessions table

Revision ID: c1f2a3b4d5e7
Revises: b2d6e8f4a1c7
Create Date: 2026-05-12 03:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c1f2a3b4d5e7"
down_revision: Union[str, None] = "b2d6e8f4a1c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users: добавляем поля для пароля WebApp
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("password_hash", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("password_set_at", sa.DateTime(timezone=True), nullable=True))

    # user_sessions: новая таблица для WebApp auth токенов.
    # created_at/updated_at идут из Base mixin'а — модели Base их ожидают,
    # без них любой SELECT по UserSession упадёт UndefinedColumnError.
    op.create_table(
        "user_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_tg_id", sa.BigInteger(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash", name="uq_user_sessions_token_hash"),
    )
    op.create_index(
        "ix_user_sessions_user_tg_id",
        "user_sessions",
        ["user_tg_id"],
    )
    op.create_index(
        "ix_user_sessions_token_hash",
        "user_sessions",
        ["token_hash"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_sessions_token_hash", table_name="user_sessions")
    op.drop_index("ix_user_sessions_user_tg_id", table_name="user_sessions")
    op.drop_table("user_sessions")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("password_set_at")
        batch_op.drop_column("password_hash")
