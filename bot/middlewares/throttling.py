# middlewares/throttling.py
"""
Middleware для защиты от спама и rate limiting.
"""
from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message
from collections import OrderedDict
import time
import logging

from aiogram.fsm.storage.base import BaseStorage
from aiogram.fsm.storage.redis import RedisStorage
from shared.constants import SENSITIVE_TRADING_STATES
from bot.utils import get_event_user

logger = logging.getLogger(__name__)


class ThrottlingMiddleware(BaseMiddleware):
    """Middleware для ограничения частоты запросов от пользователей."""
    
    # Критичные состояния с более строгим rate limit
    CRITICAL_STATES = SENSITIVE_TRADING_STATES
    
    # Максимальный размер кэша для предотвращения утечки памяти
    MAX_CACHE_SIZE = 10000
    # Время жизни записи в кэше (1 час)
    CACHE_TTL_SECONDS = 3600
    
    def __init__(self, storage: BaseStorage, rate_limit: float = 0.1, critical_rate_limit: float = 3.0):
        """
        Args:
            storage: FSM Storage (RedisStorage / MemoryStorage)
            rate_limit: Минимальное время между обычными запросами в секундах
            critical_rate_limit: Минимальное время между критичными операциями в секундах
        """
        super().__init__()
        self.rate_limit = rate_limit
        self.critical_rate_limit = critical_rate_limit
        self.storage = storage
        self.is_redis = isinstance(storage, RedisStorage)
        # OrderedDict для LRU eviction и контроля размера (fallback для MemoryStorage)
        self.user_last_request: OrderedDict[tuple, float] = OrderedDict()
    
    def _cleanup_old_entries(self, current_time: float):
        """Удаляет устаревшие записи из кэша."""
        expired_keys = [
            key for key, timestamp in self.user_last_request.items()
            if current_time - timestamp > self.CACHE_TTL_SECONDS
        ]
        for key in expired_keys:
            del self.user_last_request[key]
    
    def _ensure_cache_size(self):
        """Удаляет самые старые записи если кэш превысил лимит."""
        while len(self.user_last_request) > self.MAX_CACHE_SIZE:
            # OrderedDict удаляет первый элемент при popitem(last=False)
            self.user_last_request.popitem(last=False)
    
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        user = get_event_user(event, data)
        
        if not user:
            return await handler(event, data)
        
        user_id = user.id
        current_time = time.time()
        
        state = data.get("state")
        current_state = None
        if state:
            current_state = await state.get_state()
            
        is_critical = current_state in self.CRITICAL_STATES
        limit = self.critical_rate_limit if is_critical else self.rate_limit
        
        if self.is_redis:
            # Распределенный Redis throttling
            redis = self.storage.redis
            key = f"throttle:{user_id}:{int(is_critical)}"
            # Используем SET PX NX для поддержки миллисекунд (limit=0.5 -> 500ms)
            is_allowed = await redis.set(key, "1", px=max(1, int(limit * 1000)), nx=True)
            
            if not is_allowed:
                logger.warning(f"[THROTTLE-REDIS] user_id={user_id}, critical={is_critical}")
                if hasattr(event, "answer"):
                    try:
                        # Если это CallbackQuery, нужно ответить, чтобы кнопка не зависала
                        from aiogram.types import CallbackQuery
                        if isinstance(event, CallbackQuery):
                            await event.answer("⏱ Слишком быстро! Подождите немного.", show_alert=False)
                        else:
                            await event.answer("⏱ Слишком быстро! Подождите немного.")
                    except Exception as e:
                        logger.debug(f"Failed to send throttle message: {e}")
                return
        else:
            # Очистка старых записей и контроль размера кэша (Fallback)
            self._cleanup_old_entries(current_time)
            self._ensure_cache_size()

            request_key = (user_id, is_critical)
            
            # Проверяем, не слишком ли быстро пользователь отправляет запросы
            if request_key in self.user_last_request:
                time_passed = current_time - self.user_last_request[request_key]
                if time_passed < limit:
                    # Слишком быстро - игнорируем запрос
                    logger.warning(f"[THROTTLE-MEM] user_id={user_id}, critical={is_critical}, time_passed={time_passed:.2f}s")
                    
                    if hasattr(event, "answer"):
                        try:
                            from aiogram.types import CallbackQuery
                            if isinstance(event, CallbackQuery):
                                await event.answer("⏱ Слишком быстро! Подождите немного.", show_alert=False)
                            else:
                                await event.answer("⏱ Слишком быстро! Подождите немного.")
                        except Exception as e:
                            logger.debug(f"Failed to send throttle message: {e}")
                    
                    return
            
            # Обновляем время последнего запроса
            self.user_last_request[request_key] = current_time
        
        return await handler(event, data)
