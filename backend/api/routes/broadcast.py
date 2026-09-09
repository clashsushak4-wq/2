import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from aiogram import Bot
from aiogram.types import FSInputFile
from aiogram.exceptions import TelegramAPIError
import os
from sqlalchemy import select

from backend.core.deps import get_admin_user_id
from backend.api.schemas import SuccessResponse
from shared.config import config
from shared.database.core import session_maker
from shared.database.models import User

logger = logging.getLogger(__name__)

router = APIRouter()

class BroadcastRequest(BaseModel):
    text: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None

async def broadcast_worker(text: Optional[str], media_url: Optional[str], media_type: Optional[str]):
    bot_token = config.BOT_TOKEN.get_secret_value()
    bot = Bot(token=bot_token)
    try:
        async with session_maker() as session:
            result = await session.execute(select(User.tg_id))
            users = result.scalars().all()
            
        success_count = 0
        error_count = 0
        
        logger.info(f"Начинаем рассылку для {len(users)} пользователей...")

        UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
        media_input = None

        if media_url:
            filename = media_url.split("/")[-1]
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(filepath):
                media_input = FSInputFile(filepath)
            else:
                logger.error(f"Файл для рассылки не найден: {filepath}")
        
        for tg_id in users:
            try:
                if media_input and media_type == 'photo':
                    await bot.send_photo(tg_id, photo=media_input, caption=text or "")
                elif media_input and media_type == 'video':
                    await bot.send_video(tg_id, video=media_input, caption=text or "")
                else:
                    if text:
                        await bot.send_message(tg_id, text=text)
                success_count += 1
            except TelegramAPIError as e:
                logger.warning(f"Ошибка отправки пользователю {tg_id}: {e}")
                error_count += 1
            except Exception as e:
                logger.error(f"Неизвестная ошибка отправки {tg_id}: {e}")
                error_count += 1
            
            # Rate limiting (~20 msgs per sec)
            await asyncio.sleep(0.05)
            
        logger.info(f"Рассылка завершена! Успешно: {success_count}, Ошибок: {error_count}")
    except Exception as e:
        logger.error(f"Критическая ошибка в фоновом воркере рассылки: {e}")
    finally:
        await bot.session.close()

@router.post("/admin/bot/broadcast", response_model=SuccessResponse)
async def start_broadcast(
    req: BroadcastRequest,
    background_tasks: BackgroundTasks,
    _admin_id: int = Depends(get_admin_user_id),
):
    if not req.text and not req.media_url:
        return SuccessResponse(success=False, error="Ни текст, ни медиа не переданы")

    background_tasks.add_task(broadcast_worker, req.text, req.media_url, req.media_type)
    return SuccessResponse()
