export function connectWebSocket(onMessage, onError, onClose) {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    let socket;

    const connect = () => {
        socket = new WebSocket("ws://127.0.0.1:8000/ws");

        socket.onopen = () => {
            console.log("✅ WebSocket Connected ✅");
            reconnectAttempts = 0;
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📡 WebSocket Message:", data);
                if (onMessage) onMessage(data);
            } catch (err) {
                console.error("❌ WebSocket Message JSON Error:", err);
                console.warn("Received raw message:", event.data);
            }
        };

        socket.onerror = (error) => {
            console.error("❌ WebSocket Error:", error);
            if (onError) onError(error);
        };

        socket.onclose = (event) => {
            console.warn(`❌ WebSocket Disconnected (Code: ${event.code})`);

            // Only attempt to reconnect on abnormal closures
            if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                console.log(`🔄 Attempting reconnect in 5s (Attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
                setTimeout(connect, 5000);
            } else if (reconnectAttempts >= maxReconnectAttempts) {
                console.error("🚫 Max reconnect attempts reached. Giving up.");
            }

            if (onClose) onClose(event);
        };
    };

    connect();
    return socket;
}
