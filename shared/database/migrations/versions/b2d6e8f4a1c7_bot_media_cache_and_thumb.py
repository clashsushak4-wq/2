"""bot_media: thumb_url + tg_file_id

Добавляет:
  * `thumb_url` — путь к мини-превью для админки.
  * `tg_file_id` — кэш Telegram file_id, чтобы повторные отправки не
    перезаливали файл в TG (это в десятки раз быстрее).

Revision ID: b2d6e8f4a1c7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-09 16:55:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2d6e8f4a1c7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'bot_media',
        sa.Column('thumb_url', sa.String(length=500), nullable=True),
    )
    op.add_column(
        'bot_media',
        sa.Column('tg_file_id', sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('bot_media', 'tg_file_id')
    op.drop_column('bot_media', 'thumb_url')
