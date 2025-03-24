import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.httpserver
import threading
import time
import subprocess
import json
import logging

# WebSocket clients list
clients = []

# Logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# ========== WebSocket Handler ==========

class ScanWebSocket(tornado.websocket.WebSocketHandler):
    def open(self):
        logging.info("✅ WebSocket connected")
        clients.append(self)

    def on_close(self):
        logging.info("❌ WebSocket disconnected")
        if self in clients:
            clients.remove(self)

    def on_message(self, message):
        logging.info("📩 Message from client: %s", message)

    def check_origin(self, origin):
        return True


def broadcast_to_clients(message):
    for client in clients:
        try:
            client.write_message(message)
        except Exception as e:
            logging.error("❌ Error sending message to WebSocket client: %s", str(e))


# ========== CORS Base Handler ==========

class BaseCORSHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with, content-type")
        self.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def options(self, *args, **kwargs):
        self.set_status(204)
        self.finish()


# ========== Drive Detection Endpoint ==========

class DriveListHandler(BaseCORSHandler):
    def get(self):
        logging.info("📡 Fetching available physical drives...")
        drives = []
        try:
            result = subprocess.run(["lsblk", "-ndo", "NAME,TYPE"], capture_output=True, text=True)
            lines = result.stdout.strip().split("\n")
            for line in lines:
                parts = line.split()
                if len(parts) == 2 and parts[1] == "disk":
                    drives.append(parts[0])
            logging.info("✅ Detected drives: %s", drives)
        except Exception as e:
            logging.error("❌ Failed to list drives: %s", str(e))
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"drives": drives}))


# ========== SMART Monitoring Endpoint ==========

class SmartHandler(BaseCORSHandler):
    def get(self, device):
        logging.info("📡 Fetching SMART data for: %s", device)
        try:
            result = subprocess.run(["smartctl", "-a", f"/dev/{device}"], capture_output=True, text=True)
            output = result.stdout
            logging.info("✅ SMART data fetched for /dev/%s", device)
        except Exception as e:
            output = f"Error fetching SMART data: {str(e)}"
            logging.error("❌ %s", output)
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"output": output}))


# ========== Simulated Scan Task ==========

def perform_scan(device):
    logging.info("🔍 Scan thread started for %s", device)
    try:
        for progress in range(0, 101, 20):
            msg = {
                "type": "scan_progress",
                "drive": device,
                "progress": progress
            }
            broadcast_to_clients(json.dumps(msg))
            logging.info("📡 Sending scan progress: %s", msg)
            time.sleep(2)
        broadcast_to_clients(json.dumps({
            "type": "scan_complete",
            "drive": device
        }))
        logging.info("✅ Scan complete for %s", device)
    except Exception as e:
        logging.error("❌ Scan error on %s: %s", device, str(e))


# ========== Scan Start Endpoint ==========

class ScanHandler(BaseCORSHandler):
    def post(self, device):
        logging.info("🔄 Starting scan for %s...", device)
        thread = threading.Thread(target=perform_scan, args=(device,))
        thread.start()
        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"status": "scan_started", "drive": device}))


# ========== App Setup ==========

def make_app():
    return tornado.web.Application([
        (r"/ws", ScanWebSocket),
        (r"/drives", DriveListHandler),
        (r"/smart/(.*)", SmartHandler),
        (r"/scan/(.*)", ScanHandler),
    ])


# ========== Server Start ==========

if __name__ == "__main__":
    app = make_app()
    server = tornado.httpserver.HTTPServer(app)
    server.listen(8000)
    logging.info("🚀 Tornado Server running at http://127.0.0.1:8000")
    tornado.ioloop.IOLoop.current().start()
