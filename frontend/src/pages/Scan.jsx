// src/pages/Scan.jsx

import React, { useState, useEffect } from "react";
import { fetchDrives, startScan } from "../api/api";
import { useWebSocket } from "../context/WebSocketContext";

const Scan = () => {
  const [drives, setDrives] = useState([]);
  const [scanStatus, setScanStatus] = useState({});
  const socket = useWebSocket();

  useEffect(() => {
    const loadDrives = async () => {
      try {
        const { drives } = await fetchDrives(); // ✅ Expecting structured response
        if (Array.isArray(drives)) {
          setDrives(drives);
        } else {
          console.warn("⚠️ No valid drives found in response.");
        }
      } catch (error) {
        console.error("❌ Error fetching drives:", error);
      }
    };

    loadDrives();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📡 Scan update received:", data);

        if (data.type === "scan_progress") {
          const { drive, progress } = data;
          setScanStatus((prev) => ({
            ...prev,
            [drive]: `${progress}%`,
          }));
        } else if (data.type === "scan_complete") {
          const { drive } = data;
          setScanStatus((prev) => ({
            ...prev,
            [drive]: "✅ Completed",
          }));
        } else if (data.type === "info") {
          console.log("ℹ️ Info message:", data.message);
        }
      } catch (error) {
        console.error("❌ WebSocket message parsing failed:", error);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  const handleScan = async (drive) => {
    try {
      const res = await startScan(drive);
      console.log(`🚀 Scan started for ${drive}`, res);
      setScanStatus((prev) => ({
        ...prev,
        [drive]: "Starting...",
      }));
    } catch (error) {
      console.error(`❌ Failed to start scan for ${drive}:`, error);
      setScanStatus((prev) => ({
        ...prev,
        [drive]: "❌ Failed to start",
      }));
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-bold mb-4">🛠 Start Disk Scan</h2>

      {drives.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {drives.map((drive) => (
            <div
              key={drive}
              className="p-4 bg-gray-800 rounded-md shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold mb-2">🖴 /dev/{drive}</h3>
              <button
                onClick={() => handleScan(drive)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md mb-2"
              >
                🚀 Start Scan
              </button>
              <div className="text-sm">
                <strong>Status:</strong> {scanStatus[drive] || "Idle"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-yellow-300">⚠️ No drives available for scanning.</p>
      )}
    </div>
  );
};

export default Scan;
