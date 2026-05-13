"""Bot Media API — управление медиа-слотами бота из админки.

Слоты определены в `BOT_MEDIA_SLOTS` (см. ниже): админка получает их
через `GET /` (даже для пустых слотов возвращается запись с
`file_url=None`), а через `PUT /{key}` устанавливает/меняет файл.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.schemas import SuccessResponse
from backend.api.schemas.bot_media import BotMediaResponse, BotMediaUpdate
from backend.core.deps import get_admin_user_id, get_session
from shared.database.repo.bot_media import BotMediaRepo

router = APIRouter()


# Реестр слотов: машинный ключ → описание для админки.
# Менять только здесь — фронт получает этот список через GET.
BOT_MEDIA_SLOTS: list[dict] = [
    {
        "key": "onboarding_welcome",
        "title": "Приветствие / выбор языка",
        "description": "Показывается при первом /start над текстом выбора языка.",
    },
    {
        "key": "nickname_create",
        "title": "Создание уникального ID",
        "description": "Показывается после выбора языка над инструкцией к никнейму.",
    },
    {
        "key": "profile_main",
        "title": "Профиль",
        "description": "Показывается над карточкой профиля при нажатии кнопки «Профиль» в боте.",
    },
    {
        "key": "settings_main",
        "title": "Настройки",
        "description": "Показывается над меню настроек при переходе из карточки профиля.",
    },
    {
        "key": "admin_main",
        "title": "Админ-панель",
        "description": "Показывается над меню админ-панели при нажатии кнопки «Админ панель» в главном меню.",
    },
    {
        "key": "info_main",
        "title": "Информация",
        "description": "Показывается над текстом раздела «Информация» при нажатии кнопки «Информация» в главном меню.",
    },
]


@router.get("/", response_model=List[BotMediaResponse])
async def list_bot_media(
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    repo = BotMediaRepo(session)
    existing = {m.key: m for m in await repo.get_all()}

    result: list[BotMediaResponse] = []
    for slot in BOT_MEDIA_SLOTS:
        media = existing.get(slot["key"])
        result.append(
            BotMediaResponse(
                key=slot["key"],
                file_url=media.file_url if media else None,
                thumb_url=media.thumb_url if media else None,
                updated_at=media.updated_at if media else None,
            )
        )
    return result


@router.get("/slots")
async def list_slots(_admin_id: int = Depends(get_admin_user_id)):
    """Метаданные слотов (title/description) для UI админки."""
    return BOT_MEDIA_SLOTS


@router.put("/{key}", response_model=BotMediaResponse)
async def set_bot_media(
    key: str,
    data: BotMediaUpdate,
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    if not any(s["key"] == key for s in BOT_MEDIA_SLOTS):
        raise HTTPException(status_code=404, detail=f"Unknown media slot: {key}")
    if not data.file_url or not data.file_url.startswith("/uploads/"):
        raise HTTPException(status_code=400, detail="file_url must start with /uploads/")
    if data.thumb_url and not data.thumb_url.startswith("/uploads/"):
        raise HTTPException(status_code=400, detail="thumb_url must start with /uploads/")

    repo = BotMediaRepo(session)
    media = await repo.upsert(key=key, file_url=data.file_url, thumb_url=data.thumb_url)
    return BotMediaResponse(
        key=media.key,
        file_url=media.file_url,
        thumb_url=media.thumb_url,
        updated_at=media.updated_at,
    )


@router.delete("/{key}", response_model=SuccessResponse)
async def delete_bot_media(
    key: str,
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    repo = BotMediaRepo(session)
    await repo.delete_by_key(key)
    # Идемпотентно: если слота не было — всё равно success.
    return SuccessResponse()
