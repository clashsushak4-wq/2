# database/migrations/versions/3a4b5c6d7e8f_add_server_default_tickets.py
"""add_server_default_tickets

Revision ID: 3a4b5c6d7e8f
Revises: f33c0cf27eba
Create Date: 2026-08-05 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a4b5c6d7e8f'
down_revision: Union[str, None] = 'f33c0cf27eba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add server_default to created_at and updated_at for tickets
    op.alter_column('tickets', 'created_at', server_default=sa.text('now()'), existing_type=sa.DateTime())
    op.alter_column('tickets', 'updated_at', server_default=sa.text('now()'), existing_type=sa.DateTime())
    
    # Add server_default to created_at and updated_at for ticket_messages
    op.alter_column('ticket_messages', 'created_at', server_default=sa.text('now()'), existing_type=sa.DateTime())
    op.alter_column('ticket_messages', 'updated_at', server_default=sa.text('now()'), existing_type=sa.DateTime())


def downgrade() -> None:
    # Remove server_default
    op.alter_column('tickets', 'created_at', server_default=None, existing_type=sa.DateTime())
    op.alter_column('tickets', 'updated_at', server_default=None, existing_type=sa.DateTime())
    
    op.alter_column('ticket_messages', 'created_at', server_default=None, existing_type=sa.DateTime())
    op.alter_column('ticket_messages', 'updated_at', server_default=None, existing_type=sa.DateTime())
