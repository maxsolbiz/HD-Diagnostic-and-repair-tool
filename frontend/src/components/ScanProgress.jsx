// src/components/ScanProgress.jsx
import React, { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";

const ScanProgress = ({ drive }) => {
  const socket = useWebSocket();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("starting");

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Check for progress update
        if (data?.type === "scan_progress" && data.drive === drive) {
          setProgress(data.progress);
          setStatus("in_progress");
        }

        // Scan complete signal
        if (data?.type === "scan_complete" && data.drive === drive) {
          setProgress(100);
          setStatus("completed");
        }
      } catch (err) {
        console.error("❌ Failed to parse WebSocket message in ScanProgress:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, drive]);

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            status === "completed" ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-white mt-1">
        {status === "completed"
          ? `✅ Scan complete for /dev/${drive}`
          : `${progress}% complete`}
      </p>
    </div>
  );
};

export default ScanProgress;
