import { useEffect, useState } from "react";

const useWebSocket = (userId: string | null) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (userId) {
      const socketConnection = new WebSocket(`wss://localhost:7201/api/websocket/connect?userId=${userId}`);

      socketConnection.onopen = () => {
        setIsConnected(true);
        console.log("🔗 WebSocket conectado");
      };

      socketConnection.onerror = (error) => {
        console.error("❌ Error en WebSocket:", error);
      };

      socketConnection.onclose = () => {
        setIsConnected(false);
        console.log("🔗 WebSocket desconectado");
      };

      socketConnection.onmessage = (event) => {
        console.log("📩 Mensaje recibido:", event.data);
      };

      setSocket(socketConnection);

      return () => {
        socketConnection.close();
      };
    }
  }, [userId]);

  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.send(message);
    }
  };

  return { socket, isConnected, sendMessage };
};

export default useWebSocket;
