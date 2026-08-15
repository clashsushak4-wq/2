# handlers/profile/main/utils.py
from typing import Callable

def build_profile_text(message_or_callback_user_id: int, user, _: Callable, title_key: str = 'profile_title') -> str:
    """Собирает текст карточки Профиля."""
    if not user:
        nickname = "Unknown"
        username = "Unknown"
        reg_date = "N/A"
    else:
        nickname = user.nickname or _('no_username')
        username = f"@{user.username}" if user.username else _('no_username')
        reg_date = user.created_at.strftime('%Y-%m-%d')

    return (
        f"{_(title_key)}\n\n"
        f"╔ <b>{_('label_id')}</b> <code>{message_or_callback_user_id}</code>\n"
        f"╠ <b>{_('label_nik')}</b> <code>#{nickname}</code>\n"
        f"╠ <b>{_('label_username')}</b> <code>{username}</code>\n"
        f"╚ <b>{_('label_reg')}</b> <code>{reg_date}</code>"
    )
