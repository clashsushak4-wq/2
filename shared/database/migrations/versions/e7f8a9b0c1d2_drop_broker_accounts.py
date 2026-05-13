"""drop broker_accounts (Capital.com removed)

Revision ID: e7f8a9b0c1d2
Revises: efadb2b9d87d
Create Date: 2026-05-02 19:10:00.000000

Удаляет полностью инфраструктуру брокерских аккаунтов, которая создавалась
под Capital.com:
  * `trades.broker_account_id` + FK `trades_broker_account_id_fkey`
  * таблицу `broker_accounts` + её индексы и уникальный ключ

Всё Capital.com-специфичное убрано из приложения, оставлять таблицу в схеме
нет смысла — сделки теперь не привязаны к брокеру на уровне БД.

`batch_alter_table` используется, чтобы миграция работала и на PostgreSQL
(native ALTER), и на SQLite (copy-and-move: SQLite не умеет ALTER/DROP FK).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, None] = "efadb2b9d87d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Имя FK было задано явно в миграции b3c4d5e6f7a8_trades_broker_set_null.
_TRADES_BROKER_FK = "trades_broker_account_id_fkey"


def upgrade() -> None:
    # ── 1. Убираем FK + колонку в trades ─────────────────────────
    with op.batch_alter_table("trades") as batch_op:
        batch_op.drop_constraint(_TRADES_BROKER_FK, type_="foreignkey")
        batch_op.drop_column("broker_account_id")

    # ── 2. Удаляем таблицу broker_accounts ───────────────────────
    # Индексы и unique-constraint на таблице будут удалены каскадно вместе
    # с таблицей на PostgreSQL; на SQLite drop_table тоже сносит всё сразу.
    # Явно дропаем индексы до drop_table для совместимости с naming-стратегиями
    # Alembic'а, которые могут требовать эксплицитного удаления.
    with op.batch_alter_table("broker_accounts") as batch_op:
        batch_op.drop_constraint("uq_user_account_name", type_="unique")
    op.drop_index("ix_user_broker", table_name="broker_accounts")
    op.drop_index(op.f("ix_broker_accounts_user_id"), table_name="broker_accounts")
    op.drop_table("broker_accounts")


def downgrade() -> None:
    # ── 1. Восстанавливаем таблицу broker_accounts ───────────────
    op.create_table(
        "broker_accounts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("broker_name", sa.String(length=20), nullable=False),
        sa.Column("account_name", sa.String(length=255), nullable=False),
        sa.Column("api_key_enc", sa.String(length=500), nullable=False),
        sa.Column("password_enc", sa.String(length=500), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.tg_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "account_name", name="uq_user_account_name"),
    )
    op.create_index(
        op.f("ix_broker_accounts_user_id"),
        "broker_accounts",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_broker",
        "broker_accounts",
        ["user_id", "broker_name"],
        unique=False,
    )

    # ── 2. Возвращаем колонку + FK в trades ──────────────────────
    with op.batch_alter_table("trades") as batch_op:
        batch_op.add_column(
            sa.Column("broker_account_id", sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            _TRADES_BROKER_FK,
            "broker_accounts",
            ["broker_account_id"],
            ["id"],
            ondelete="SET NULL",
        )
