import subprocess
import json

def fetch_hdd_smart(drive):
    """Fetch SMART data for an HDD using `smartctl`."""
    try:
        result = subprocess.run(["smartctl", "-A", f"/dev/{drive}"], capture_output=True, text=True)
        return {"drive": drive, "smart_data": result.stdout}
    
    except Exception as e:
        return {"error": str(e)}
