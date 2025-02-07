"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PlayerCard from "@/components/PlayerCard";
import FriendsList from "@/components/FriendsList";
import WaitingRoom from "@/components/WaitingRoom";

interface Player {
  id: string;
  apodo: string;
  avatar: string;
}

const WS_URL = "wss://localhost:7201/api/websocket/connect";

export default function MatchmakingView() {
  const [isHost, setIsHost] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentPlayer({
        id: parsedUser.id,
        apodo: parsedUser.apodo,
        avatar: `https://localhost:7201/images/${parsedUser.avatar}`,
      });
      connectWebSocket(parsedUser.id);
    }
  }, []);

  const connectWebSocket = (userId: string) => {
    const ws = new WebSocket(`${WS_URL}?userId=${userId}`);
    ws.onmessage = (event) => {
      const message = event.data.split("|");
      if (message[0] === "RoomCreated") {
        setRoomId(message[1]);
      } else if (message[0] === "GameStarted") {
        router.push(`/game?roomId=${message[1]}`);
      }
    };
    ws.onerror = (err) => console.error("WebSocket error:", err);
    setSocket(ws);
  };

  const handleCreateRoom = () => {
    if (!currentPlayer || !socket) return;
    socket.send(`CreateRoom|${currentPlayer.id}`);
  };

console.log(roomId);

  const handlePlayBot = () => {
    if (!roomId || !socket) return;
    socket.send(`PlayAgainstBot|${roomId}`);
    setOpponent({ id: "bot", apodo: "Bot UNO", avatar: "/images/bot-avatar.png" });
  };

  const handleInviteFriend = () => {
    setShowFriendsList(true);
  };

  const handleSelectFriend = (friend: Player) => {
    if (!roomId || !currentPlayer || !socket) return;
    setOpponent(friend);
    setShowFriendsList(false);
    socket.send(`InviteFriend|${roomId},${friend.id}`);
  };

  const handleLeave = () => {
    socket?.close();
    router.push("/menu");
  };

  if (!currentPlayer) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 p-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Emparejamiento</h1>

      <div className="flex justify-center space-x-8 mb-8">
        <PlayerCard player={currentPlayer} isHost={isHost} />
        {opponent ? (
          <PlayerCard player={opponent} isHost={!isHost} />
        ) : (
          <div className="w-64 h-64 bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-white text-xl">Esperando oponente...</p>
          </div>
        )}
      </div>

      {!roomId && (
        <div className="text-center mt-8">
          <button
            onClick={handleCreateRoom}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Crear Sala
          </button>
        </div>
      )}

      {roomId && isHost && (
        <div className="text-center mt-8">
          <button
            onClick={handlePlayBot}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Jugar contra Bot
          </button>
          <button
            onClick={handleInviteFriend}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded ml-4"
          >
            Invitar Amigo
          </button>
        </div>
      )}

      {showFriendsList && (
        <FriendsList onSelectFriend={handleSelectFriend} onClose={() => setShowFriendsList(false)} />
      )}

      <div className="text-center mt-8">
        <button onClick={handleLeave} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
          Abandonar
        </button>
      </div>
    </div>
  );
}
