
# main.py (Enhanced Version)
import json
import subprocess
import re
import tornado.ioloop
import tornado.web
import tornado.websocket
import logging
import time
import threading
import asyncio

# ✅ Setup logging
logging.basicConfig(
    filename="logs/backend.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# ✅ Store active WebSocket clients
clients = set()

def send_update(message):
    disconnected_clients = set()

    async def _send(client, msg):
        try:
            logging.debug(f"📤 Sending WebSocket message: {msg}")
            await client.write_message(json.dumps(msg))
        except Exception as e:
            logging.error(f"❌ Error sending WebSocket message: {e}")
            disconnected_clients.add(client)

    for client in clients:
        tornado.ioloop.IOLoop.current().add_callback(_send, client, message)

    clients.difference_update(disconnected_clients)

class BaseHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def options(self, *args):
        self.set_status(204)
        self.finish()

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        logging.info("✅ WebSocket connected")
        clients.add(self)
        self.write_message(json.dumps({"type": "info", "message": "WebSocket connected"}))
        self.ping_callback = tornado.ioloop.PeriodicCallback(self.send_ping, 10000)
        self.ping_callback.start()

    def send_ping(self):
        try:
            self.ping(b"ping")
            logging.info("📡 WebSocket Ping sent")
        except tornado.websocket.WebSocketClosedError:
            logging.warning("❌ WebSocket Closed, stopping ping")
            self.ping_callback.stop()

    def on_pong(self, data):
        logging.info("✅ WebSocket Pong received")

    def on_message(self, message):
        try:
            data = json.loads(message)
            logging.info(f"📩 WebSocket Received: {data}")
            self.write_message(json.dumps({"echo": data}))
        except json.JSONDecodeError:
            logging.error("❌ Invalid JSON received over WebSocket")
            self.write_message(json.dumps({"type": "error", "message": "Invalid JSON format"}))

    def on_close(self):
        logging.info("❌ WebSocket disconnected")
        if self in clients:
            clients.remove(self)
        if hasattr(self, "ping_callback"):
            self.ping_callback.stop()

    def check_origin(self, origin):
        return True

class DriveListHandler(BaseHandler):
    def get(self):
        logging.info("📡 Fetching available physical drives...")
        try:
            result = subprocess.run(
                ["lsblk", "-d", "-n", "-o", "NAME,TYPE"],
                capture_output=True,
                text=True
            )
            lines = result.stdout.strip().split("\n")
            drives = [line.split()[0] for line in lines if "disk" in line]

            response = {"drives": drives}
            self.set_header("Content-Type", "application/json")
            self.write(json.dumps(response, indent=4))
        except Exception as e:
            logging.error(f"❌ Error fetching drive list: {e}")
            self.write(json.dumps({"error": str(e)}))

class SmartDataHandler(BaseHandler):
    def get(self, drive):
        logging.info(f"📡 Fetching SMART data for {drive}")
        smart_data = self.get_smart_data(drive)

        response = {
            "drive": drive,
            "smart_data": smart_data
        }

        self.set_header("Content-Type", "application/json")
        self.write(json.dumps(response, indent=4))

    def get_smart_data(self, device):
        try:
            command = ['smartctl', '-A', f"/dev/{device}"]
            logging.info(f"📌 Running command: {' '.join(command)}")

            result = subprocess.run(command, capture_output=True, text=True)

            logging.info(f"✅ SMART command output:\n{result.stdout}")
            if result.stderr:
                logging.warning(f"⚠️ SMART command stderr:\n{result.stderr}")

            if result.returncode != 0:
                return {"error": f"SMART command failed. Error: {result.stderr}"}

            return self.parse_smart_output(result.stdout)

        except Exception as e:
            logging.error(f"❌ Error fetching SMART data for {device}: {str(e)}")
            return {"error": f"Unexpected error: {str(e)}"}

    def parse_smart_output(self, output):
        smart_attributes = {}

        for line in output.splitlines():
            match = re.match(
                r'^\s*(\d+)\s+([\w\d_-]+)\s+0x[\dA-Fa-f]+\s+(\d+)\s+(\d+)\s+(\d+)\s+[\w-]+\s+[\w-]+\s+-\s+(\d+)',
                line
            )
            if match:
                attr_id, attr_name, value, worst, threshold, raw_value = match.groups()
                smart_attributes[attr_name] = {
                    "id": int(attr_id),
                    "value": int(value),
                    "worst": int(worst),
                    "threshold": int(threshold),
                    "raw_value": int(raw_value)
                }

        logging.info(f"✅ Parsed SMART attributes: {json.dumps(smart_attributes, indent=4)}")
        return smart_attributes

class ScanHandler(BaseHandler):
    def post(self, drive):
        logging.info(f"🔄 Starting scan for {drive}...")
        thread = threading.Thread(target=self.run_scan, args=(drive,))
        thread.start()
        self.write({"status": "scan_started", "drive": drive})

    def run_scan(self, drive):
        logging.info(f"🔍 Scan thread started for {drive}")
        send_update({"type": "scan_status", "drive": drive, "status": "Initializing..."})
        time.sleep(2)
        for progress in range(0, 101, 20):
            message = {"type": "scan_progress", "drive": drive, "progress": progress}
            logging.info(f"📡 Sending scan progress: {message}")
            send_update(message)
            time.sleep(2)
        logging.info(f"✅ Scan complete for {drive}")
        send_update({"type": "scan_complete", "drive": drive})

def make_app():
    return tornado.web.Application([
        (r"/drives", DriveListHandler),
        (r"/smart/(.*)", SmartDataHandler),
        (r"/scan/(.*)", ScanHandler),
        (r"/ws", WebSocketHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8000)
    logging.info("🚀 Tornado Server running at http://127.0.0.1:8000")
    tornado.ioloop.IOLoop.current().start()