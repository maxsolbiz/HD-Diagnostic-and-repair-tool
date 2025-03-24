import asyncio
import os
import time
from modules.websocket_handler import send_progress_update

async def scan_drive(drive):
    """Performs a surface scan on a given drive."""
    sector_size = 512
    total_size = os.stat(f"/dev/{drive}").st_size  # Get total size of drive
    scanned = 0
    bad_sectors = 0

    try:
        with open(f"/dev/{drive}", 'rb') as f:
            while scanned < total_size:
                try:
                    f.seek(scanned)
                    f.read(sector_size)
                except Exception:
                    bad_sectors += 1

                scanned += sector_size
                progress = int((scanned / total_size) * 100)

                send_progress_update(drive, progress, bad_sectors)
                await asyncio.sleep(0.1)  # Simulate real-time progress

        return {"success": True, "bad_sectors": bad_sectors}

    except Exception as e:
        return {"success": False, "error": str(e)}
