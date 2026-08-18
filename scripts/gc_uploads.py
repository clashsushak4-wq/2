import os
import sys
import asyncio
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from shared.database.core import get_session
from sqlalchemy import select
from shared.database.models.bot_media import BotMedia
from shared.database.models.home import HomeTile

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"

async def main():
    if not UPLOAD_DIR.exists():
        print("Uploads directory does not exist.")
        return

    print("Fetching active URLs from database...")
    active_urls = set()

    async for session in get_session():
        # 1. Fetch from BotMedia
        result = await session.execute(select(BotMedia))
        media_list = result.scalars().all()
        for media in media_list:
            if media.file_url:
                active_urls.add(media.file_url.split('/')[-1])
            if media.thumb_url:
                active_urls.add(media.thumb_url.split('/')[-1])

        # 2. Fetch from HomeTile
        result = await session.execute(select(HomeTile))
        tiles = result.scalars().all()
        for tile in tiles:
            content = tile.content
            if not isinstance(content, dict):
                continue
            
            # Extract URLs from possible fields
            if content.get("image"):
                active_urls.add(content["image"].split('/')[-1])
            if content.get("bg_image"):
                active_urls.add(content["bg_image"].split('/')[-1])
            if content.get("bg_images") and isinstance(content["bg_images"], list):
                for img in content["bg_images"]:
                    if img:
                        active_urls.add(img.split('/')[-1])

    print(f"Found {len(active_urls)} active files in DB.")

    deleted_count = 0
    # 3. Iterate over the uploads directory
    for file_path in UPLOAD_DIR.iterdir():
        if file_path.is_file():
            # Skip basic dotfiles just in case
            if file_path.name.startswith('.'):
                continue
            
            if file_path.name not in active_urls:
                print(f"Deleting orphaned file: {file_path.name}")
                file_path.unlink()
                deleted_count += 1

    print(f"Cleanup complete. Deleted {deleted_count} orphaned files.")

if __name__ == "__main__":
    asyncio.run(main())
