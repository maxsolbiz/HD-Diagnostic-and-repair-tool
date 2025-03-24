import subprocess

def secure_erase(drive):
    """Performs secure erase using `hdparm`."""
    try:
        result = subprocess.run(["hdparm", "--user-master", "u", "--security-erase", "password", f"/dev/{drive}"], capture_output=True, text=True)
        return {"drive": drive, "message": result.stdout}
    
    except Exception as e:
        return {"error": str(e)}
