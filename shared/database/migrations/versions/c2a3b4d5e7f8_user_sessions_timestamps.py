"""user_sessions: add missing created_at/updated_at

Forward-fix к c1f2a3b4d5e7. UserSession наследуется от Base, у которого
есть колонки created_at/updated_at, но в первоначальной миграции я их
пропустил — SELECT падал с UndefinedColumnError.

Revision ID: c2a3b4d5e7f8
Revises: c1f2a3b4d5e7
Create Date: 2026-05-12 21:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2a3b4d5e7f8"
down_revision: Union[str, None] = "c1f2a3b4d5e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("user_sessions") as batch_op:
        batch_op.add_column(
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("user_sessions") as batch_op:
        batch_op.drop_column("updated_at")
        batch_op.drop_column("created_at")
