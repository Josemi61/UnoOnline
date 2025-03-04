"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import PlayerCard from "@/components/PlayerCard";
import FriendsList from "@/components/FriendsList";
import { useWebSocket, WebSocketContext } from "@/context/WebSocketContext";

interface Player {
  id: string;
  apodo: string;
  avatar: string;
}

const WS_URL = "wss://localhost:7201/api/websocket/connect";

export default function MatchmakingView() {
  const [isHost, setIsHost] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const router = useRouter();
  const { roomId, setRoomId, socket, opponent, isSearching, invitation, setOpponent, setIsSearching, setInvitation } = useWebSocket();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentPlayer({
        id: parsedUser.id,
        apodo: parsedUser.apodo,
        avatar: `https://localhost:7201/images/${parsedUser.avatar}`,
      });
    }
  }, []);

  const handleCreateRoom = () => {
    if (!currentPlayer) return;
    setRoomId(null);
    setOpponent(null);
    sendMessage(`CreateRoom|${currentPlayer.id}`);
  };

  const handlePlayRandom = () => {
    if (!currentPlayer) return;
    setIsSearching(true);
    sendMessage(`JoinRandomRoom|${currentPlayer.id}`);
  };

  const handlePlayBot = () => {
    if (!roomId) return;
    sendMessage(`PlayAgainstBot|${roomId}`);
    setOpponent({ id: "bot", apodo: "Bot UNO", avatar: "/images/bot-avatar.png" });
  };

  const handleInviteFriend = () => {
    setShowFriendsList(true);
  };

  const handleSelectFriend = (friend: Player) => {
    if (!roomId) return;
    setOpponent(friend);
    setShowFriendsList(false);
    sendMessage(`InviteFriend|${roomId},${friend.id}`);
    console.log(`📩 Enviando invitación a ${friend.id} para unirse a la sala ${roomId}`);
  };

  const handleAcceptInvitation = () => {
    if (!invitation || !currentPlayer) return;
    sendMessage(`JoinGame|${currentPlayer.id},${invitation.roomId}`);
    setRoomId(invitation.roomId);
    setOpponent({ id: invitation.senderId, apodo: "Unknown", avatar: "/images/default-avatar.png" });
    setInvitation(null);
  };

  const handleRejectInvitation = () => {
    setInvitation(null);
  };

  const handleLeave = () => {
    socket?.close();
    router.push("/menu");
  };

  const sendMessage = (message: string) => {
    if (socket) {
      socket.send(message);
    }
  };

  // ** Mostrar el botón "Jugar" si hay un oponente definido **
  const canPlay = !!opponent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 p-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Emparejamiento</h1>

      <div className="flex justify-center space-x-8 mb-8">
        {currentPlayer && <PlayerCard player={currentPlayer} isHost={isHost} />}
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
          {!isSearching && (
            <button
              onClick={handlePlayRandom}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded ml-4"
            >
              Buscar Partida Aleatoria
            </button>
          )}
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

      {invitation && (
        <div className="text-center mt-8 bg-gray-800 p-4 rounded-lg">
          <p className="text-white">Te han invitado a una sala</p>
          <button onClick={handleAcceptInvitation} className="bg-green-500 px-4 py-2 m-2 rounded">Aceptar</button>
          <button onClick={handleRejectInvitation} className="bg-red-500 px-4 py-2 m-2 rounded">Rechazar</button>
        </div>
      )}

      {canPlay && (
        <div className="text-center mt-8">
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-lg"
          >
            JUGAR
          </button>
        </div>
      )}

      <div className="text-center mt-8">
        <button onClick={handleLeave} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
          Abandonar
        </button>
      </div>
    </div>
  );
}
