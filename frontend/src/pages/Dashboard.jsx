// src/pages/Dashboard.jsx

import React, { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { fetchDrives, startScan } from "../api/api"; // ✅ Corrected import
import ScanProgress from "../components/ScanProgress";

const Dashboard = () => {
  const socket = useWebSocket();
  const [drives, setDrives] = useState([]);
  const [scanStatuses, setScanStatuses] = useState({});

  useEffect(() => {
    fetchDrives()
      .then((response) => {
        console.log("✅ Fetched Drives: ", response);
        const drivesArray = response?.drives || [];
        if (Array.isArray(drivesArray) && drivesArray.length > 0) {
          setDrives(drivesArray);
        } else {
          console.warn("⚠️ No valid drives found in response.");
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching drives:", error);
      });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📡 Scan update received: ", data);

        if (data.type === "scan_progress") {
          setScanStatuses((prev) => ({
            ...prev,
            [data.drive]: `${data.progress}%`,
          }));
        }

        if (data.type === "scan_complete") {
          setScanStatuses((prev) => ({
            ...prev,
            [data.drive]: "✅ Completed",
          }));
        }

        if (data.type === "info" && data.message.includes("connected")) {
          console.log("ℹ️ WebSocket Info:", data.message);
        }
      } catch (err) {
        console.error("❌ Error parsing WebSocket message:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  const handleStartScan = (drive) => {
    startScan(drive)
      .then((res) => {
        console.log(`🚀 Scan started for ${drive}`, res);
        setScanStatuses((prev) => ({ ...prev, [drive]: "Starting..." }));
      })
      .catch((err) => {
        console.error(`❌ Failed to start scan for ${drive}:`, err);
      });
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">📊 HDD Diagnostic Dashboard</h1>

      {drives.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {drives.map((drive, index) => (
            <div key={index} className="p-4 bg-gray-800 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">🖴 /dev/{drive}</h3>

              <button
                onClick={() => handleStartScan(drive)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md mb-2"
              >
                🚀 Start Scan
              </button>

              <div className="text-sm mt-2 mb-2">
                <span className="font-semibold text-green-400">Status:</span>{" "}
                {scanStatuses[drive] || "Idle"}
              </div>

              {scanStatuses[drive] && scanStatuses[drive] !== "Idle" && (
                <ScanProgress drive={drive} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-yellow-300">⚠️ No drives available for scanning.</p>
      )}
    </div>
  );
};

export default Dashboard;
