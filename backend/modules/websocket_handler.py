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
