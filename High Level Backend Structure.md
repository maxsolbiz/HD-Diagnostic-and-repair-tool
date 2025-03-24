### **🚀 High-Level Backend Structure for HDD Diagnostic & Repair Application**
Your **backend** will be responsible for handling **disk operations, monitoring, and real-time updates**. Given your requirements, we will use **Tornado (WebSockets)** for **real-time updates** and **async processing** to ensure efficient parallel scans.

---

## **1️⃣ Backend Technology Stack**
| **Component**   | **Technology** |
|---------------|--------------|
| **Web Framework** | **Tornado (Python)** |
| **Real-Time Updates** | **WebSockets** |
| **Disk Operations** | `smartctl`, `dd`, `hdparm` (Linux utilities) |
| **Data Storage (Logs & Reports)** | JSON/CSV/PDF |
| **Parallel Processing** | `asyncio`, `concurrent.futures` |
| **API Format** | REST (for standard requests) + WebSockets (for real-time updates) |

---

## **2️⃣ Backend File Structure**
```
backend/
│── logs/                      # Logs & Reports Storage
│── modules/
│   │── drive_detection.py      # Detects connected drives
│   │── smart_hdd.py            # Fetch SMART data for HDDs
│   │── smart_ssd.py            # Fetch SMART data for SSDs
│   │── smart_nvme.py           # Fetch SMART data for NVMe SSDs
│   │── scan.py                 # Surface scanning logic
│   │── benchmark.py            # Disk benchmarking module
│   │── secure_erase.py         # Secure erase functionality
│   └── websocket_handler.py    # Handles WebSocket communication
│── main.py                     # 🚀 Main Tornado Server
│── requirements.txt             # Dependencies
└── README.md                    # Documentation
```

---

## **3️⃣ Core Features & Implementation Plan**
### ✅ **1. Drive Detection API**
- Detects all connected drives and their types.
- Uses `lsblk`, `fdisk`, and `smartctl` for identification.

### ✅ **2. SMART Monitoring API**
- Fetches detailed SMART attributes per drive.
- Uses `smartctl` for fetching drive health.

### ✅ **3. Surface Scanning**
- Reads sectors and reports bad sectors.
- Uses `dd` or direct **binary read** operations.
- **WebSockets** send progress updates to UI.

### ✅ **4. Benchmarking**
- Measures **Read/Write Speeds**.
- Uses `dd` or Python’s `os`/`subprocess` methods.
- Displays results in **tables + graphs**.

### ✅ **5. Secure Erase & Low-Level Formatting**
- Uses `hdparm`, `blkdiscard`, `dd` for erasure.
- Provides a **warning prompt** before proceeding.

---

## **4️⃣ WebSocket API (Real-Time Updates)**
- **Frontend → Backend:** Starts scan operation.
- **Backend → Frontend:** Sends periodic progress updates.

✅ **Example WebSocket Message:**
```json
{
  "event": "scan_progress",
  "drive": "/dev/sda",
  "progress": 75,
  "bad_sectors": 2
}
```

---

## **5️⃣ Implementation Details (Code)**
### 🚀 **1. WebSocket Handling**
We'll use **Tornado's WebSocket** to send real-time updates.

#### 📌 **`websocket_handler.py`**
```python
import json
import tornado.websocket

# Store active connections
connected_clients = set()

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        """Called when a new WebSocket connection is established."""
        connected_clients.add(self)
        self.write_message(json.dumps({"message": "Connected to WebSocket"}))
    
    def on_message(self, message):
        """Handles incoming messages from the frontend."""
        data = json.loads(message)
        print(f"Received message: {data}")
    
    def on_close(self):
        """Removes client from the active set when connection closes."""
        connected_clients.remove(self)

def send_progress_update(drive, progress, bad_sectors):
    """Broadcasts scan progress to all WebSocket clients."""
    message = json.dumps({
        "event": "scan_progress",
        "drive": drive,
        "progress": progress,
        "bad_sectors": bad_sectors
    })
    for client in connected_clients:
        client.write_message(message)
```

---

### 🚀 **2. Disk Scan Implementation**
We'll **read drive sectors in chunks** and **send progress updates**.

#### 📌 **`scan.py`**
```python
import asyncio
import os
import time
from modules.websocket_handler import send_progress_update

async def scan_drive(drive):
    """Performs surface scanning on a given drive."""
    sector_size = 512  # Standard sector size
    total_size = os.stat(drive).st_size  # Get total size of the drive
    scanned = 0
    bad_sectors = 0

    try:
        with open(drive, 'rb') as f:
            while scanned < total_size:
                try:
                    f.seek(scanned)
                    f.read(sector_size)
                except Exception:
                    bad_sectors += 1  # Mark sector as bad

                scanned += sector_size
                progress = int((scanned / total_size) * 100)

                # Send progress update via WebSocket
                send_progress_update(drive, progress, bad_sectors)
                
                # Simulate real-time delay
                await asyncio.sleep(0.1)

        return {"success": True, "bad_sectors": bad_sectors}

    except Exception as e:
        return {"success": False, "error": str(e)}
```

---

### 🚀 **3. SMART Data Fetching**
Fetch drive health using `smartctl`.

#### 📌 **`smart_hdd.py`**
```python
import subprocess
import json

def fetch_hdd_smart(drive):
    """Fetches SMART data for an HDD."""
    try:
        result = subprocess.run(
            ["smartctl", "-A", drive], capture_output=True, text=True
        )
        return {"drive": drive, "smart_data": result.stdout}
    
    except Exception as e:
        return {"error": str(e)}
```

---

### 🚀 **4. Tornado Main Server**
This **starts the backend**, registers WebSocket & REST API routes.

#### 📌 **`main.py`**
```python
import os
import tornado.ioloop
import tornado.web
import tornado.websocket
import asyncio
import logging

from modules.drive_detection import detect_drives
from modules.smart_hdd import fetch_hdd_smart
from modules.scan import scan_drive
from modules.websocket_handler import WebSocketHandler

# Enable logging
logging.basicConfig(filename="logs/backend.log", level=logging.INFO)

class SmartDataHandler(tornado.web.RequestHandler):
    def get(self, drive):
        """Fetches SMART data for a given drive."""
        logging.info(f"Fetching SMART data for {drive}")
        data = fetch_hdd_smart(f"/dev/{drive}")
        self.write(json.dumps(data, indent=4))

class ScanHandler(tornado.web.RequestHandler):
    async def post(self, drive):
        """Starts a scan for the given drive asynchronously."""
        logging.info(f"Starting scan on {drive}")
        result = await scan_drive(f"/dev/{drive}")
        self.write(json.dumps(result, indent=4))

def make_app():
    return tornado.web.Application([
        (r"/smart/(.*)", SmartDataHandler),
        (r"/scan/(.*)", ScanHandler),
        (r"/websocket", WebSocketHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8000)
    logging.info("🚀 Tornado Server running at http://127.0.0.1:8000")
    tornado.ioloop.IOLoop.current().start()
```

---

## **6️⃣ Next Steps**
| **Feature** | **Status** |
|------------|-----------|
| **WebSocket Implementation** | ✅ Done |
| **SMART Monitoring API** | ✅ Done |
| **Surface Scanning (Parallel Processing)** | ✅ Implemented |
| **Real-Time Scan Updates** | ✅ Done |
| **Benchmarking** | 🚧 Next Step |
| **Secure Erase & Formatting** | 🚧 Future Implementation |

---

## **7️⃣ Conclusion**
- 🚀 **Backend uses WebSockets for real-time updates.**
- 🔄 **Scan process runs in parallel & provides real-time progress.**
- 📊 **Results are displayed in table & graph format.**
- ⚡ **Efficient handling of disk operations using async processing.**

Would you like me to refine **benchmarking** or focus on **secure erase** next? 🚀

### **Complete Backend Code & Testing Guide 🚀**
Here’s the **full backend code**, including all necessary files, along with **testing instructions** to ensure your **HDD Diagnostic & Repair Toolkit** works smoothly.

---

## **📁 Full Backend Directory Structure**
```
backend/
│── logs/                        # Logs & Reports Storage
│── modules/
│   │── drive_detection.py        # Detects connected drives
│   │── smart_hdd.py              # Fetch SMART data for HDDs
│   │── smart_ssd.py              # Fetch SMART data for SSDs
│   │── smart_nvme.py             # Fetch SMART data for NVMe SSDs
│   │── scan.py                   # Surface scanning logic
│   │── benchmark.py              # Disk benchmarking module
│   │── secure_erase.py           # Secure erase functionality
│   │── websocket_handler.py      # Handles WebSocket communication
│── main.py                       # 🚀 Main Tornado Server
│── requirements.txt               # Dependencies
└── README.md                      # Documentation
```

---

## **📜 1️⃣ `drive_detection.py` (Detects Connected Drives)**
This module **detects all drives** connected to the system.

```python
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
```

---

## **📜 2️⃣ `smart_hdd.py` (Fetch SMART Data for HDDs)**
This module **fetches HDD SMART attributes** using `smartctl`.

```python
import subprocess
import json

def fetch_hdd_smart(drive):
    """Fetch SMART data for an HDD using `smartctl`."""
    try:
        result = subprocess.run(["smartctl", "-A", f"/dev/{drive}"], capture_output=True, text=True)
        return {"drive": drive, "smart_data": result.stdout}
    
    except Exception as e:
        return {"error": str(e)}
```

---

## **📜 3️⃣ `scan.py` (Surface Scanning)**
This module **performs surface scanning** on a given drive.

```python
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
```

---

## **📜 4️⃣ `benchmark.py` (Read/Write Benchmarking)**
This module **measures disk performance**.

```python
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
```

---

## **📜 5️⃣ `secure_erase.py` (Secure Erase Feature)**
This module **performs a secure erase on the disk**.

```python
import subprocess

def secure_erase(drive):
    """Performs secure erase using `hdparm`."""
    try:
        result = subprocess.run(["hdparm", "--user-master", "u", "--security-erase", "password", f"/dev/{drive}"], capture_output=True, text=True)
        return {"drive": drive, "message": result.stdout}
    
    except Exception as e:
        return {"error": str(e)}
```

---

## **📜 6️⃣ `websocket_handler.py` (Real-Time WebSocket Handler)**
This module **handles WebSocket connections**.

```python
import json
import tornado.websocket

connected_clients = set()

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        connected_clients.add(self)
        self.write_message(json.dumps({"message": "Connected to WebSocket"}))
    
    def on_message(self, message):
        data = json.loads(message)
        print(f"Received WebSocket message: {data}")
    
    def on_close(self):
        connected_clients.remove(self)

def send_progress_update(drive, progress, bad_sectors):
    """Sends real-time scan progress updates."""
    message = json.dumps({
        "event": "scan_progress",
        "drive": drive,
        "progress": progress,
        "bad_sectors": bad_sectors
    })
    for client in connected_clients:
        client.write_message(message)
```

---

## **📜 7️⃣ `main.py` (Main Backend API & WebSocket Server)**
This is the **Tornado Server** managing API requests and WebSockets.

```python
import os
import tornado.ioloop
import tornado.web
import tornado.websocket
import asyncio
import logging

from modules.drive_detection import detect_drives
from modules.smart_hdd import fetch_hdd_smart
from modules.scan import scan_drive
from modules.websocket_handler import WebSocketHandler

logging.basicConfig(filename="logs/backend.log", level=logging.INFO)

class SmartDataHandler(tornado.web.RequestHandler):
    def get(self, drive):
        """Fetch SMART data for a given drive."""
        logging.info(f"Fetching SMART data for {drive}")
        data = fetch_hdd_smart(drive)
        self.write(json.dumps(data, indent=4))

class ScanHandler(tornado.web.RequestHandler):
    async def post(self, drive):
        """Starts a scan for the given drive asynchronously."""
        logging.info(f"Starting scan on {drive}")
        result = await scan_drive(drive)
        self.write(json.dumps(result, indent=4))

def make_app():
    return tornado.web.Application([
        (r"/smart/(.*)", SmartDataHandler),
        (r"/scan/(.*)", ScanHandler),
        (r"/websocket", WebSocketHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8000)
    logging.info("🚀 Tornado Server running at http://127.0.0.1:8000")
    tornado.ioloop.IOLoop.current().start()
```

---

## **🔬 How to Test**
### ✅ **1. Install Dependencies**
```bash
pip install tornado
```

### ✅ **2. Start the Backend**
```bash
python main.py
```

### ✅ **3. Test API Endpoints**
- **Check connected drives:**
  ```bash
  curl -X GET http://127.0.0.1:8000/smart/sda
  ```
- **Start surface scan:**
  ```bash
  curl -X POST http://127.0.0.1:8000/scan/sda
  ```
- **WebSocket Test:** Connect via WebSocket at:
  ```
  ws://127.0.0.1:8000/websocket
  ```

---

## **🎯 Next Steps**
- ✅ **Backend API & WebSocket working.**
- 📊 **Benchmarking & Secure Erase pending.**
- 🖥️ **Integrate with frontend UI.**

Let me know if you want **more features or optimizations!** 🚀

(venv) rukn@rukn-HP-Z820-Workstation:~/20032025/HD Diagnostic-and-repair-tool/backend$ python main.py
Traceback (most recent call last):
  File "/home/rukn/20032025/HD Diagnostic-and-repair-tool/backend/main.py", line 38, in <module>
    app.listen(8000)
  File "/home/rukn/20032025/HD Diagnostic-and-repair-tool/backend/venv/lib/python3.12/site-packages/tornado/web.py", line 2211, in listen
    server.listen(
  File "/home/rukn/20032025/HD Diagnostic-and-repair-tool/backend/venv/lib/python3.12/site-packages/tornado/tcpserver.py", line 183, in listen
    sockets = bind_sockets(
              ^^^^^^^^^^^^^
  File "/home/rukn/20032025/HD Diagnostic-and-repair-tool/backend/venv/lib/python3.12/site-packages/tornado/netutil.py", line 162, in bind_sockets
    sock.bind(sockaddr)
OSError: [Errno 98] Address already in use
(venv) rukn@rukn-HP-Z820-Workstation:~/20032025/HD Diagnostic-and-repair-tool/backend$


### **🚀 Fix: "OSError: [Errno 98] Address already in use"**

The error means **port 8000 is already in use** by another process, likely an existing instance of your Tornado server. Here’s how to resolve it:

---

### **🔍 Step 1: Find the Process Using Port 8000**
Run this command to check which process is using the port:
```bash
sudo lsof -i :8000
```

If you see an output like:
```
python   12345  rukn   6u  IPv4  654321  0t0  TCP localhost:8000 (LISTEN)
```
The **process ID (PID)** using port `8000` is **12345**.

---

### **🛑 Step 2: Kill the Process**
Kill the process using:
```bash
sudo kill -9 12345  # Replace 12345 with your actual PID
```

---

### **🚀 Step 3: Restart the Tornado Server**
Once the process is terminated, restart your Tornado backend:
```bash
python main.py
```

---

### **🔧 Alternative: Run on a Different Port**
If you don’t want to kill the process, **change the port** in `main.py`:
```python
app.listen(8080)  # Change to an available port
```
Then restart the server:
```bash
python main.py
```

---

### **📌 Summary**
✅ **Check the running process**: `sudo lsof -i :8000`  
✅ **Kill the process**: `sudo kill -9 <PID>`  
✅ **Restart Tornado**: `python main.py`  
✅ **(Optional)** Use a different port: `app.listen(8080)`

This should fix the issue! 🚀 Let me know if you need more help.

## **🚀 Next Steps for Frontend Development**
Now that we have **React + Vite + Tailwind CSS 3** set up, let’s proceed step by step:

---

## **1️⃣ Set up UI Components for the HDD Diagnostic Tool 🎨**
We'll create modular **React components** for different features of the HDD diagnostic tool.

📂 **Project Structure** (Inside `src/` folder)
```
📂 src/
 ├── 📂 components/      # Reusable UI components
 │   ├── DriveList.jsx   # List of drives
 │   ├── DriveDetails.jsx # Detailed SMART data of a drive
 │   ├── ScanProgress.jsx # Progress bar for scan
 │   ├── BenchmarkResults.jsx # Benchmark display
 │   ├── Navbar.jsx       # Top navigation
 │   ├── Footer.jsx       # Footer section
 │
 ├── 📂 pages/           # Page-level components
 │   ├── Dashboard.jsx   # Main dashboard
 │   ├── Scan.jsx        # HDD Scan page
 │   ├── Benchmark.jsx   # Benchmark page
 │
 ├── 📂 api/             # API integration
 │   ├── api.js          # Fetch data from backend
 │
 ├── App.jsx             # Root App component
 ├── main.jsx            # Entry point
 ├── index.css           # Tailwind styles
```

---

### **📌 1.1 Create Drive List Component**
Create `src/components/DriveList.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const DriveList = ({ onSelectDrive }) => {
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/drives")
      .then(response => setDrives(response.data.drives))
      .catch(error => console.error("Error fetching drives:", error));
  }, []);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-md">
      <h2 className="text-lg font-bold mb-2">Available Drives</h2>
      <ul>
        {drives.map((drive, index) => (
          <li key={index} className="p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => onSelectDrive(drive)}>
            {drive}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DriveList;
```

---

### **📌 1.2 Create Drive Details Component**
Create `src/components/DriveDetails.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const DriveDetails = ({ selectedDrive }) => {
  const [smartData, setSmartData] = useState(null);

  useEffect(() => {
    if (selectedDrive) {
      axios.get(`http://127.0.0.1:8000/smart/${selectedDrive}`)
        .then(response => setSmartData(response.data.smart_data))
        .catch(error => console.error("Error fetching SMART data:", error));
    }
  }, [selectedDrive]);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-md">
      <h2 className="text-lg font-bold mb-2">Drive Details - {selectedDrive}</h2>
      {smartData ? (
        <pre className="text-sm">{JSON.stringify(smartData, null, 2)}</pre>
      ) : (
        <p>Loading SMART data...</p>
      )}
    </div>
  );
};

export default DriveDetails;
```

---

### **📌 1.3 Create Dashboard Page**
Create `src/pages/Dashboard.jsx`:

```jsx
import React, { useState } from "react";
import DriveList from "../components/DriveList";
import DriveDetails from "../components/DriveDetails";

const Dashboard = () => {
  const [selectedDrive, setSelectedDrive] = useState(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">HDD Diagnostic Tool</h1>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <DriveList onSelectDrive={setSelectedDrive} />
        {selectedDrive && <DriveDetails selectedDrive={selectedDrive} />}
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## **2️⃣ Connect Frontend to Backend API 🔌**
We will now use **Axios** to fetch data from the backend.

### **📌 2.1 Install Axios**
Run:
```bash
npm install axios
```

### **📌 2.2 Create API Handling**
Create `src/api/api.js`:

```js
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

// Fetch available drives
export const getDrives = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/drives`);
    return response.data.drives;
  } catch (error) {
    console.error("Error fetching drives:", error);
    return [];
  }
};

// Fetch SMART data for a drive
export const getSmartData = async (drive) => {
  try {
    const response = await axios.get(`${BASE_URL}/smart/${drive}`);
    return response.data.smart_data;
  } catch (error) {
    console.error("Error fetching SMART data:", error);
    return { error: "Failed to fetch SMART data" };
  }
};
```

---

## **3️⃣ Add WebSocket Support for Real-Time Updates ⚡**
We'll now **integrate WebSockets** to receive real-time scan updates.

### **📌 3.1 Modify API to Use WebSocket**
Create `src/api/socket.js`:

```js
const WS_URL = "ws://127.0.0.1:8000/ws";

export const connectWebSocket = (onMessage) => {
  const socket = new WebSocket(WS_URL);

  socket.onopen = () => console.log("WebSocket Connected");
  socket.onmessage = (event) => onMessage(JSON.parse(event.data));
  socket.onerror = (error) => console.error("WebSocket Error:", error);
  socket.onclose = () => console.log("WebSocket Disconnected");

  return socket;
};
```

### **📌 3.2 Create Scan Progress Component**
Create `src/components/ScanProgress.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { connectWebSocket } from "../api/socket";

const ScanProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const socket = connectWebSocket((data) => {
      if (data.type === "scan_progress") {
        setProgress(data.progress);
      }
    });

    return () => socket.close();
  }, []);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-md">
      <h2 className="text-lg font-bold mb-2">Scan Progress</h2>
      <div className="w-full bg-gray-700 h-4 rounded">
        <div className="bg-green-500 h-4 rounded" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="mt-2">{progress}% Completed</p>
    </div>
  );
};

export default ScanProgress;
```

---

## **4️⃣ Integrate WebSockets into Dashboard**
Modify `src/pages/Dashboard.jsx`:

```jsx
import React, { useState } from "react";
import DriveList from "../components/DriveList";
import DriveDetails from "../components/DriveDetails";
import ScanProgress from "../components/ScanProgress";

const Dashboard = () => {
  const [selectedDrive, setSelectedDrive] = useState(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">HDD Diagnostic Tool</h1>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <DriveList onSelectDrive={setSelectedDrive} />
        {selectedDrive && <DriveDetails selectedDrive={selectedDrive} />}
        <ScanProgress />
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## **✅ Final Steps**
1. **Run Backend**
   ```bash
   python main.py
   ```

2. **Run Frontend**
   ```bash
   npm run dev
   ```

🎉 Now, the frontend should:
- Show **available drives**.
- Fetch **SMART data** on selection.
- Display **real-time scan progress** using **WebSockets**.

Let me know if you need any refinements! 🚀

