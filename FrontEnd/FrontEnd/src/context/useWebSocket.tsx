import { useEffect, useState } from "react";

const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      console.warn("No hay usuario en localStorage, WebSocket no se iniciará.");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      console.error("Error al parsear usuario de localStorage:", error);
      return;
    }

    if (!user.id) {
      console.warn("Usuario no válido en localStorage, WebSocket no se iniciará.");
      return;
    }

    console.log(`🔗 Conectando WebSocket para userId: ${user.id}`);

    const ws = new WebSocket(`wss://localhost:7201/api/websocket/connect?userId=${user.id}`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("✅ WebSocket conectado");
    };

    ws.onerror = (error) => {
      console.error("❌ Error en WebSocket:", error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.warn("⚠️ WebSocket desconectado");
    };

    ws.onmessage = (event) => {
      console.log("📩 Mensaje recibido:", event.data);
    };

    setSocket(ws);

    return () => {
      console.log("🔌 Cerrando WebSocket para userId:", user.id);
      ws.close();
    };
  }, []);

  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.send(message);
    } else {
      console.warn("No se puede enviar el mensaje, WebSocket no está conectado.");
    }
  };

  return { socket, isConnected, sendMessage };
};

export default useWebSocket;
