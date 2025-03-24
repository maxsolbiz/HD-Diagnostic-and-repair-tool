// src/context/WebSocketContext.jsx

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const connectWebSocket = () => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket Connected ✅");
      setConnected(true);
      setRetryCount(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📡 WS Message: ", data);
      } catch (err) {
        console.error("❌ WS message parse error:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket Error", error);
    };

    ws.onclose = (event) => {
      console.warn("❌ WebSocket Disconnected");
      setConnected(false);

      if (event.code !== 1000) {
        const timeout = Math.min(10000, 1000 + retryCount * 1000);
        console.log(`🔁 Attempting reconnect in ${timeout / 1000}s...`);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          connectWebSocket();
        }, timeout);
      }
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socketRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};
