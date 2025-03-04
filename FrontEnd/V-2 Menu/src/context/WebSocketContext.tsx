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
  sendMessage: (message: any) => void;
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

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn("⚠️ No se puede enviar el mensaje, WebSocket no está conectado.");
    }
  };

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
          console.log("📩 Mensaje recibido del WebSocket:", event.data);
          let parsedMessage: any;
      
          if (event.data.startsWith("{") || event.data.startsWith("[")) {
            parsedMessage = JSON.parse(event.data);
            console.log("📌 Mensaje JSON parseado:", parsedMessage);
      
            setMessages((prevMessages) => ({
              ...prevMessages,
              [parsedMessage.type]: parsedMessage,
            }));
          } else {
            const [type, ...dataParts] = event.data.split("|"); // dataParts es un array
            parsedMessage = { type, data: dataParts };
            console.warn("⚠️ Mensaje WebSocket en formato texto:", parsedMessage);
      
            switch (type) {
              case "RoomCreated":
                setRoomId(dataParts[0]);
                break;
                case "GameStarted":
                  console.log("🎮 Partida iniciada!");
                  
                  if (dataParts.length === 1) {
                    const gameData = dataParts[0].split(","); // Volver a dividir por ","
                    
                    if (gameData.length < 3) {
                      console.error("❌ Error: Datos insuficientes en GameStarted", gameData);
                      return;
                    }
                
                    const [roomId, player1, player2] = gameData; // Extraer los datos correctamente
                    setRoomId(roomId);
                    setOpponent({ id: player2, apodo: `Jugador ${player2}`, avatar: "/images/random-avatar.png" });
                
                    setMessages((prev) => ({
                      ...prev,
                      GameStarted: { roomId, player1, player2 },
                    }));
                    const gameOpponentId = player1 === user.id ? player2 : player1;
    
                    setOpponent({
                      id: gameOpponentId,
                      apodo: `Jugador ${gameOpponentId}`,
                      avatar: "/images/random-avatar.png",
                    });
                  } else {
                    console.error("❌ Error inesperado en GameStarted: estructura incorrecta", dataParts);
                  }
                  break;
                
              case "Invitation":
                if (dataParts.length < 2) {
                  console.error("❌ Error: Datos insuficientes en Invitation", dataParts);
                  return;
                }
                const [invRoomId, senderId] = dataParts;
                setInvitation({ roomId: invRoomId, senderId });
                break;
              case "JoinedGame":
                setRoomId(dataParts[0]);
                break;
              case "MatchFound":
                setRoomId(dataParts[0]);
                const gameData = dataParts[0].split(",");
                const [roomId, player1, player2] = gameData;
                const opponentId = player1 === user.id ? player2 : player1;
    
                setOpponent({
                  id: opponentId,
                  apodo: `Jugador ${opponentId}`,
                  avatar: "/images/random-avatar.png", // Ajustar si hay un endpoint para obtener avatar
                });
                setIsSearching(false);
                break;
              case "GameUpdate":
                console.log("🔄 Recibido GameUpdate:", parsedMessage);
                setMessages((prev) => ({ ...prev, gameState: parsedMessage.gameState }));
                break;
              case "PlayerTurn":
                console.log("⏳ Turno del jugador:", parsedMessage.playerId);
                setMessages((prev) => ({ ...prev, currentTurn: parsedMessage.playerId }));
                break;
              case "GameOver":
                console.log("🏆 Juego terminado, ganador:", parsedMessage.winner);
                setMessages((prev) => ({ ...prev, gameOver: parsedMessage }));
                break;
              case "CardPlayed":
                setMessages((prev) => ({ ...prev, lastMove: dataParts.join(",") }));
                break;
              case "DrawCard":
                setMessages((prev) => ({ ...prev, drawnCard: dataParts.join(",") }));
                break;
              case "ColorChosen":
                setMessages((prev) => ({ ...prev, chosenColor: dataParts[0] }));
                break;
              case "EndGame":
                setMessages((prev) => ({ ...prev, gameEnded: true }));
                break;
              default:
                console.warn("⚠️ Mensaje WebSocket no reconocido:", event.data);
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
      console.error("❌ Error al conectar WebSocket:", error);
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, messages, sendMessage, opponent, setOpponent, isSearching, invitation, setIsSearching, setInvitation, roomId, setRoomId }}>
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
