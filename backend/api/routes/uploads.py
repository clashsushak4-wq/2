import asyncio
import io
import logging
import os
import pathlib
import uuid

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, ImageOps

from backend.api.schemas import UploadResponse
from backend.core.deps import get_admin_user_id

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Раздельные whitelist'ы — для картинок применяем PIL-pipeline,
# для видео сохраняем как есть (PIL не умеет mp4/webm).
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".webm"}
ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Параметры пайплайна. Подобраны компромиссно: для Telegram-картинок
# 1280px вполне достаточно (telegram сам ужимает большие фото при отправке),
# а 256px thumb даёт мгновенную загрузку UI админки.
IMAGE_MAX_DIM = 1280
THUMB_MAX_DIM = 256
WEBP_QUALITY = 82
THUMB_QUALITY = 70


def _process_image_sync(raw: bytes, base_name: str) -> tuple[bytes, bytes]:
    """CPU-bound работа: ресайз + WebP. Запускать через asyncio.to_thread.

    Возвращает (main_webp_bytes, thumb_webp_bytes).

    `ImageOps.exif_transpose` поворачивает фото согласно EXIF — иначе
    iPhone-снимки лежат боком. После этого convert('RGB') убирает альфа-
    канал у JPEG, но для WebP сохраняем RGBA если был.
    """
    with Image.open(io.BytesIO(raw)) as im:
        im = ImageOps.exif_transpose(im)

        # Для GIF берём только первый кадр — анимация в caption всё равно не
        # рендерится в Telegram-фото; для анимации использовать sticker/document.
        if getattr(im, "is_animated", False):
            im.seek(0)

        # Главное изображение
        main = im.copy()
        main.thumbnail((IMAGE_MAX_DIM, IMAGE_MAX_DIM), Image.LANCZOS)
        main_buf = io.BytesIO()
        # WebP: RGBA для PNG, RGB для JPEG/etc — Pillow сам выбирает корректно.
        save_mode = "RGBA" if main.mode in ("RGBA", "LA", "P") else "RGB"
        if main.mode != save_mode:
            main = main.convert(save_mode)
        main.save(main_buf, format="WEBP", quality=WEBP_QUALITY, method=6)

        # Превью
        thumb = im.copy()
        thumb.thumbnail((THUMB_MAX_DIM, THUMB_MAX_DIM), Image.LANCZOS)
        thumb_buf = io.BytesIO()
        if thumb.mode != save_mode:
            thumb = thumb.convert(save_mode)
        thumb.save(thumb_buf, format="WEBP", quality=THUMB_QUALITY, method=6)

        return main_buf.getvalue(), thumb_buf.getvalue()


def _safe_join(filename: str) -> str:
    """Защита от path traversal: путь обязан остаться внутри UPLOAD_DIR."""
    abs_path = os.path.abspath(os.path.join(UPLOAD_DIR, filename))
    if not abs_path.startswith(UPLOAD_DIR):
        raise HTTPException(status_code=400, detail="Invalid file path")
    return abs_path


@router.post("/admin/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    _admin_id: int = Depends(get_admin_user_id),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    ext = pathlib.PurePosixPath(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {ext} not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    uid = uuid.uuid4().hex

    # Видео: сохраняем как есть, без превью.
    if ext in VIDEO_EXTENSIONS:
        filename = f"{uid}{ext}"
        filepath = _safe_join(filename)
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(contents)
        return UploadResponse(url=f"/uploads/{filename}")

    # Картинка: ресайз + WebP + thumbnail. PIL — CPU-bound, в thread.
    try:
        main_bytes, thumb_bytes = await asyncio.to_thread(
            _process_image_sync, contents, uid
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Image processing failed for %s: %s", file.filename, e)
        raise HTTPException(status_code=400, detail="Invalid or corrupted image") from e

    main_name = f"{uid}.webp"
    thumb_name = f"{uid}_thumb.webp"
    main_path = _safe_join(main_name)
    thumb_path = _safe_join(thumb_name)

    async with aiofiles.open(main_path, "wb") as f:
        await f.write(main_bytes)
    async with aiofiles.open(thumb_path, "wb") as f:
        await f.write(thumb_bytes)

    logger.info(
        "upload: %s -> %s (%.1f KB) + thumb (%.1f KB)",
        file.filename,
        main_name,
        len(main_bytes) / 1024,
        len(thumb_bytes) / 1024,
    )

    return UploadResponse(
        url=f"/uploads/{main_name}",
        thumb_url=f"/uploads/{thumb_name}",
    )
