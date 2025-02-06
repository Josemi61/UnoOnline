"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface WebSocketContextType {
  socket: WebSocket | null;
  sendMessage: (message: string) => void;
  messages: Record<string, any>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Record<string, any>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      console.warn("⚠️ No hay usuario en localStorage, WebSocket no se iniciará.");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      console.error("❌ Error al parsear usuario de localStorage:", error);
      return;
    }

    if (!user.id) {
      console.warn("⚠️ Usuario no válido en localStorage, WebSocket no se iniciará.");
      return;
    }

    console.log(`🔗 Intentando conectar WebSocket para userId: ${user.id}`);

    const ws = new WebSocket(`wss://localhost:7201/api/websocket/connect?userId=${user.id}`);

    ws.onopen = () => {
      console.log("✅ WebSocket conectado.");
      setSocket(ws);
    };

    ws.onerror = (error) => {
      console.error("❌ Error en WebSocket:", error);
    };

    ws.onclose = (event) => {
      console.warn("⚠️ WebSocket cerrado:", event.reason);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const newMessage = JSON.parse(event.data);
        console.log("📩 Mensaje recibido:", newMessage);

        // Asegurar que si el mensaje está vacío, no cierre WebSocket
        if (!newMessage || Object.keys(newMessage).length === 0) {
          console.warn("⚠️ WebSocket recibió un mensaje vacío, pero se mantiene abierto.");
          return;
        }

        setMessages((prevMessages) => ({
          ...prevMessages,
          ...newMessage,
        }));
      } catch (error) {
        console.error("❌ Error al parsear mensaje WebSocket:", error);
      }
    };

    return () => {
      console.log("🔌 WebSocket desconectado para userId:", user.id);
      ws.close();
    };
  }, []);

  const sendMessage = (message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      console.warn("⚠️ No se puede enviar el mensaje, WebSocket no está conectado.");
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, sendMessage, messages }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket debe usarse dentro de un WebSocketProvider.");
  }
  return context;
};
