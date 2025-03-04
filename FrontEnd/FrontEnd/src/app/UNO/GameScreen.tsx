'use client';

import { useEffect, useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";
import GameInfo from "./GameInfo";
import GameButtons from "./GameButtons";

interface Card {
  color: string;
  value: string;
}

interface Player {
  id: string;
  hand: Card[];
}

interface GameState {
  players: Record<string, Player>;
  currentTurn: string;
  deckSize: number;
}

export default function GameScreen() {
  const { messages, sendMessage, roomId } = useWebSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  console.log("📩 Estado actual de messages en GameScreen:", messages);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setPlayerId(user.id || null);
    }
  }, []);

  useEffect(() => {
    console.log("🛠 Estado actual de messages en GameScreen:", messages);
  
    if (messages.GameUpdate) {
      console.log("✅ GameUpdate detectado en GameScreen:", messages.GameUpdate);
      setGameState(messages.GameUpdate);
    }
  }, [messages]);

  const playCard = (card: Card) => {
    if (!playerId) return;
    sendMessage({ type: "PLAY_CARD", playerId, card });
  };

  if (!playerId || !gameState?.players?.[playerId]) {
    return <p className="text-xl">Cargando cartas...</p>;
  }

  return (
    <div className="flex flex-col items-center text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Juego de UNO</h1>
      {roomId ? (
        gameState ? (
          <>
            <GameInfo gameState={gameState} />
            <div className="flex gap-2 mt-4">
              {gameState.players[playerId]?.hand.map((card: Card, index: number) => (
                <button key={index} onClick={() => playCard(card)}>
                  {card.color} {card.value}
                </button>
              ))}
            </div>
            <GameButtons gameState={gameState} sendMessage={sendMessage} />
          </>
        ) : (
          <p className="text-xl">Esperando datos del juego...</p>
        )
      ) : (
        <p className="text-xl">Esperando emparejamiento...</p>
      )}
    </div>
  );
}