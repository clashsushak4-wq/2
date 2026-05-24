# middlewares/auth.py
"""
Мидлварь для защиты бота от действий незарегистрированных пользователей.
Если пользователя нет в БД, блокирует любые действия (кроме /start и callback-ов онбординга).
"""
from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message, CallbackQuery

from sqlalchemy.ext.asyncio import AsyncSession
from shared.database.repo.users import UserRepo
from bot.utils.common import get_event_user

class AuthMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        session: AsyncSession = data.get("session")
        telegram_user = get_event_user(event, data)
        
        if not telegram_user or not session:
            return await handler(event, data)
            
        # Извлекаем message или callback_query из Update (т.к. мидлварь вешается на dp.update)
        msg: Message | None = getattr(event, "message", None)
        callback: CallbackQuery | None = getattr(event, "callback_query", None)
            
        repo = UserRepo(session)
        db_user = await repo.get_user(telegram_user.id)
        
        if not db_user:
            # Пользователя нет в базе. Проверим, разрешено ли действие.
            
            # Разрешаем /start
            if msg and msg.text and msg.text.startswith("/start"):
                return await handler(event, data)
                
            # Разрешаем callback-и онбординга
            if callback and callback.data:
                allowed_prefixes = ("lang_", "nick_")
                if any(callback.data.startswith(p) for p in allowed_prefixes):
                    return await handler(event, data)
            
            # Иначе — блокируем действие
            _ = data.get("_")
            error_text = _("auth_required") if _ else "⚠️ Вы не зарегистрированы. Пожалуйста, отправьте команду /start"
            
            try:
                if msg:
                    await msg.answer(error_text)
                elif callback:
                    await callback.answer(error_text, show_alert=True)
            except Exception:
                pass
                
            return # Прерываем цепочку обработки
            
        return await handler(event, data)
