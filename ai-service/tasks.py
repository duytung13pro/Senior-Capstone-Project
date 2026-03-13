import asyncio
import time
from config import logger, MEDIA_DIR, SEVEN_DAYS_IN_SECONDS, CHECK_INTERVAL_SECONDS

def delete_old_files():
    """Deletes files in MEDIA_DIR older than 7 days."""
    if not MEDIA_DIR.exists():
        return
    
    current_time = time.time()
    logger.info("Starting background cleanup task...")
    
    files_deleted = 0
    for file_path in MEDIA_DIR.iterdir():
        if file_path.is_file():
            try:
                # Check if file is older than 7 days
                if (current_time - file_path.stat().st_mtime) > SEVEN_DAYS_IN_SECONDS:
                    file_path.unlink()
                    files_deleted += 1
                    logger.info(f"Deleted old file: {file_path.name}")
            except Exception as e:
                logger.error(f"Failed to delete {file_path.name}: {e}")
    
    logger.info(f"Cleanup complete. Deleted {files_deleted} files.")

async def periodic_cleanup_task():
    """Runs the cleanup task periodically."""
    while True:
        delete_old_files()
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)
