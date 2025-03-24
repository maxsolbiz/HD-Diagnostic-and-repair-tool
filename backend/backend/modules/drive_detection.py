import subprocess
import json

def detect_drives():
    """Detects all connected drives using `lsblk`."""
    try:
        result = subprocess.run(["lsblk", "-J", "-o", "NAME,TYPE"], capture_output=True, text=True)
        drives = json.loads(result.stdout)
        drive_list = {}

        for device in drives.get("blockdevices", []):
            if device["type"] == "disk":
                drive_list[device["name"]] = "hdd"  # Default to HDD (to be refined)
        
        return drive_list
    except Exception as e:
        return {"error": str(e)}
