# handlers/profile/referral/utils.py
from typing import Callable
from shared.database.models.users import User

def build_referral_text(bot_username: str, user: User, _: Callable) -> str:
    """Формирует текст для экрана реферальной программы."""
    ref_link = f"https://t.me/{bot_username}?start=ref_{user.tg_id}"
    
    # Так как активные рефералы сейчас не отслеживаются отдельно,
    # выводим общее количество, либо 0 если их нет.
    ref_active = user.referrals_count
    
    text = _(
        "referral_title",
        ref_count=user.referrals_count,
        ref_earned=f"{user.referral_total_earned:.2f}",
        ref_active=ref_active,
        ref_link=ref_link,
    )
    return text
