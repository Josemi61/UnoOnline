"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import UserProfileModal from "./UserProfileModal"; // Importar el modal de perfil

interface Friend {
  id: string;
  avatar: string;
  apodo: string;
  status: "connected" | "disconnected" | "playing";
}

interface FriendsListProps {
  onClose: () => void;
  userId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7201";

export default function FriendsList({ onClose }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).id : null;

    if (!userId) {
      setError("No se encontró la ID del usuario.");
      return;
    }

    const fetchFriends = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Search/SearchAmigos/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
          body: JSON.stringify({ apodo: searchTerm.trim() || "" }),
        });

        if (!response.ok) {
          throw new Error("Error al obtener la lista de amigos.");
        }

        const data: Friend[] = await response.json();
        setFriends(data);
      } catch (error) {
        setError("No se pudo obtener la lista de amigos.");
      }
    };

    fetchFriends();
  }, [searchTerm]);

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar a este amigo?")) {
      setFriends(friends.filter((friend) => friend.id !== friendId));
    }
  };

  return (
    <div className="mt-4 bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Buscar amigos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded bg-white/10 text-white placeholder-gray-300"
        />
        <button onClick={onClose} className="ml-2 text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded">
          Cerrar
        </button>
      </div>

      {error ? (
        <p className="text-red-500 text-sm text-center">{error}</p>
      ) : (
        <ul className="space-y-4">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center justify-between bg-white/10 p-4 rounded-lg cursor-pointer hover:bg-white/20"
              onClick={() => setSelectedFriend(friend)}
            >
              <div className="flex items-center">
                <Image
                  src={friend.avatar.startsWith("http") ? friend.avatar : `${API_URL}/images/${friend.avatar}`}
                  alt={friend.apodo || "Imagen de usuario"}
                  width={35}
                  height={35}
                  className="rounded-full mr-4"
                  unoptimized
                />
                <div>
                  <h3 className="font-bold">{friend.apodo}</h3>
                  <p
                    className={`text-sm ${
                      friend.status === "connected"
                        ? "text-green-400"
                        : friend.status === "playing"
                        ? "text-yellow-400"
                        : "text-gray-400"
                    }`}
                  >
                    {friend.status === "connected" ? "Conectado" : friend.status === "playing" ? "Jugando" : "Desconectado"}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFriend(friend.id);
                }}
                className="text-red-400 hover:text-red-200"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedFriend && (
        <UserProfileModal userId={selectedFriend.id} onClose={() => setSelectedFriend(null)} />
      )}
    </div>
  );
}
