"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Friend {
  id: string;
  avatar: string;
  apodo: string;
  status: "connected" | "disconnected" | "playing";
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7201";

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        console.log("Amigos recibidos:", data); // Debug
        setFriends(data);
      } catch (error) {
        console.error("Error al obtener amigos:", error);
        setError("No se pudo obtener la lista de amigos.");
      }
    };

    fetchFriends();
  }, [searchTerm]);

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar a este amigo?")) {
      try {
        // Aquí podrías hacer una petición al backend para eliminar al amigo
        setFriends(friends.filter((friend) => friend.id !== friendId));
      } catch (error) {
        console.error("Error al eliminar amigo:", error);
      }
    }
  };

  return (
    <div className="mt-4">
      <input
        type="text"
        placeholder="Buscar amigos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 rounded bg-white/10 text-white placeholder-gray-300 mb-4"
      />
      {error ? (
        <p className="text-red-500 text-sm text-center">{error}</p>
      ) : (
        <ul className="space-y-4">
          {friends.map((friend) => (
            <li key={friend.id} className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
              <div className="flex items-center">
                <Image
                  src={
                    friend.avatar.startsWith("http")
                      ? friend.avatar
                      : `${API_URL}/images/${friend.avatar}`
                  }
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
                    {friend.status === "connected"
                      ? "Conectado"
                      : friend.status === "playing"
                      ? "Jugando"
                      : "Desconectado"}
                  </p>
                </div>
              </div>
              <div>
                <Link href={`/profile/${friend.id}`} className="text-blue-300 hover:text-blue-100 mr-4">
                  Ver Perfil
                </Link>
                <button onClick={() => handleRemoveFriend(friend.id)} className="text-red-400 hover:text-red-200">
                  Eliminar Amigo
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}