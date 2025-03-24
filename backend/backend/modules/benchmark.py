import time
import os

def benchmark_read_speed(drive, size=1024 * 1024):  # 1MB
    """Measures disk read speed."""
    start_time = time.time()
    
    with open(f"/dev/{drive}", 'rb') as f:
        f.read(size)

    elapsed_time = time.time() - start_time
    speed = size / elapsed_time / (1024 * 1024)  # MB/s
    return {"drive": drive, "read_speed": f"{speed:.2f} MB/s"}
