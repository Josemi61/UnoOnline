"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface WebSocketContextType {
  socket: WebSocket | null;
  setOpponent: React.Dispatch<React.SetStateAction<Player | null>>;
  messages: Record<string, any>;
  opponent: Player | null;
  isSearching: boolean;
  invitation: { roomId: string; senderId: string } | null;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  setInvitation: React.Dispatch<React.SetStateAction<{ roomId: string; senderId: string } | null>>;
  roomId: string | null;
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>;
}

interface Player {
  id: string;
  apodo: string;
  avatar: string;
}

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);


interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [invitation, setInvitation] = useState<{ roomId: string; senderId: string } | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

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

    try {
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
          console.log("📩 Mensaje recibido:", event.data);
      
          // Verificamos si el mensaje es JSON o texto con formato personalizado
          if (event.data.startsWith("{") || event.data.startsWith("[")) {
            // Si el mensaje parece ser un JSON, lo parseamos
            const newMessage = JSON.parse(event.data);
            setMessages((prevMessages) => ({
              ...prevMessages,
              ...newMessage,
            }));
          } else {
            // Si el mensaje es un string con formato "Tipo|Datos"
            const [type, data] = event.data.split("|");
      
            console.log(`📌 Mensaje WebSocket procesado: Tipo=${type}, Datos=${data}`);
      
            if (type === "FriendRequest") {
              console.log("📨 Nueva solicitud de amistad:", data);
              // Aquí podrías actualizar el estado con la nueva solicitud de amistad
            }
            console.log("Tipo", event.data[0]);
            switch (type) {
              case "RoomCreated":
                console.log("creandoroom");
                setRoomId(data);
                break;
              case "GameStarted":
                setRoomId(data);
                setOpponent({
                  id: data[3],
                  apodo: `Jugador ${data}`,
                  avatar: "/images/random-avatar.png",
                });
                break;
              case "Invitation":
                setInvitation({ roomId: data, senderId: data });
                break;
              case "JoinedGame":
                setRoomId(data);
                break;
              case "MatchFound":
                setRoomId(event.data);
                setOpponent({
                  // const [data1, data2] = data.split(","); 
                  id: data[2],
                  apodo: `Jugador ${data[2]}`,
                  avatar: "/images/random-avatar.png",
                });
                setIsSearching(false);
                break;
            }
          }
        } catch (error) {
          console.error("❌ Error al procesar mensaje WebSocket:", error);
        }
      };    
  
      return () => {
        console.log("🔌 WebSocket desconectado para userId:", user.id);
        ws.close();
      };
    } catch (error) {
      console.error("")
      
    }


  }, []);



  return (
    <WebSocketContext.Provider value={{ socket, messages, opponent, setOpponent, isSearching, invitation, setIsSearching, setInvitation, roomId, setRoomId }}>
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
