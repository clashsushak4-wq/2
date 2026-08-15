# handlers/common/navigation/referral.py
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.i18n import i18n
from shared.database.repo.users import UserRepo

logger = logging.getLogger(__name__)

async def _notify_referrer(session: AsyncSession, bot, referrer_id: int) -> None:
    try:
        repo = UserRepo(session)
        referrer = await repo.get_user(referrer_id)
        if referrer:
            await bot.send_message(
                chat_id=referrer_id,
                text=i18n.get("new_referral_notification", lang=referrer.language)
            )
    except Exception as e:
        logger.warning(f"Не удалось отправить уведомление рефереру {referrer_id}: {e}")
