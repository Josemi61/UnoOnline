"use client"; 

import { createContext, useContext, useRef, useEffect, useState } from 'react';
import { useAuth } from './Authprovider';

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
  const {
    user
  } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket){
        socket.close(); setSocket(null); console.log("cerrando socket");
    }
    return;

    };
      if(socket) return;
      console.log("🔗 Intentando conectar al WebSocket...");
      const ws = new WebSocket(`wss://localhost:7201/api/websocket/connect?userId=${user.id}`);

      ws.onopen = () => {
        console.log("✅ Conectado al WebSocket");
        setSocket(ws);
      };

      ws.onerror = (error) => {
        console.error("❌ Error en WebSocket:", error);
      };

      ws.onclose = () => {
        console.warn("⚠️ WebSocket cerrado, intentando reconectar...");
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
            const newMessage: Record<string, any> = JSON.parse(event.data);
            console.log("Mensaje recibido:", newMessage);

         
            if (newMessage.totalUsersConnected) {
                setMessages((prevMessages) => ({
                    ...prevMessages,
                    ...newMessage, 
                }));
            }
        } catch (error) {
            console.error("Error al parsear mensaje:", error);
        }
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const sendMessage = (message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
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
    throw new Error('useWebSocket debe ser usado dentro de un WebSocketProvider');
  }
  return context;
};
