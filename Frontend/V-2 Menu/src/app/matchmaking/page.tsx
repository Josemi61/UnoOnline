"use client";

// Componente MatchmakingView
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PlayerCard from "@/components/PlayerCard";
import ActionButtons from "@/components/ActionButtons";
import FriendsList from "@/components/FriendsList";
import WaitingRoom from "@/components/WaitingRoom";

interface Player {
  id: string;
  apodo: string;
  avatar: string;
}

export default function MatchmakingView() {
  const [isHost, setIsHost] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Recuperar usuario desde localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentPlayer({
        id: parsedUser.id,
        apodo: parsedUser.apodo,
        avatar: parsedUser.avatar.startsWith("http")
          ? parsedUser.avatar
          : `https://localhost:7201/images/${parsedUser.avatar}`,
      });
    }

    // Verificar si el jugador fue invitado
    const wasInvited = new URLSearchParams(window.location.search).get("invited") === "true";
    setIsHost(!wasInvited);
  }, []);

  const handlePlayBot = () => {
    setOpponent({
      id: "bot",
      apodo: "Bot UNO",
      avatar: "/images/bot-avatar.png",
    });
  };

  const handlePlayRandom = () => {
    setIsSearching(true);
    setTimeout(() => {
      setOpponent({
        id: "random",
        apodo: "Jugador Aleatorio",
        avatar: "/images/random-avatar.png",
      });
      setIsSearching(false);
    }, 3000);
  };

  const handleInviteFriend = () => {
    setShowFriendsList(true);
  };

  const handleSelectFriend = (friend: Player) => {
    setOpponent(friend);
    setShowFriendsList(false);
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    setOpponent(null);
  };

  const handleStartGame = () => {
    router.push("/game");
  };

  const handleLeave = () => {
    router.push("/menu");
  };

  if (!currentPlayer) {
    return <div className="text-white text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 p-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Emparejamiento</h1>

      <div className="flex justify-center space-x-8 mb-8">
        {/* Mostrar el usuario actual con su imagen de avatar */}
        <div className="w-64 h-64 bg-white/10 p-4 rounded-lg flex flex-col items-center">
          <Image
            src={currentPlayer.avatar}
            alt={`Avatar de ${currentPlayer.apodo}`}
            width={80}
            height={80}
            className="rounded-full"
            unoptimized
          />
          <h2 className="text-white font-bold text-lg mt-4">{currentPlayer.apodo}</h2>
          {isHost && <p className="text-yellow-400">Anfitrión</p>}
        </div>

        {opponent ? (
          <PlayerCard player={opponent} isHost={!isHost} />
        ) : (
          <div className="w-64 h-64 bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-white text-xl">Esperando oponente...</p>
          </div>
        )}
      </div>

      {isHost && !opponent && !isSearching && (
        <ActionButtons onPlayBot={handlePlayBot} onPlayRandom={handlePlayRandom} onInviteFriend={handleInviteFriend} />
      )}

      {isSearching && <WaitingRoom onCancel={handleCancelSearch} />}

      {showFriendsList && <FriendsList onSelectFriend={handleSelectFriend} onClose={() => setShowFriendsList(false)} />}

      {isHost && opponent && (
        <div className="text-center mt-8">
          <button
            onClick={handleStartGame}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Iniciar Partida
          </button>
        </div>
      )}

      {!isHost && opponent && (
        <div className="text-center mt-8">
          <p className="text-white text-xl">Esperando a que el anfitrión inicie la partida...</p>
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
