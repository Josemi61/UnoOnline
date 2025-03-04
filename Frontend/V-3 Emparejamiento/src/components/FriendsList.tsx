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

interface FriendsListProps {
  onSelectFriend: (friend: Friend) => void;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7201";

export default function FriendsList({ onSelectFriend, onClose }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.id) {
          setUserId(parsedUser.id.toString());
        } else {
          setError("Error: No se encontró la ID del usuario.");
          return;
        }
      } catch (error) {
        setError("Error al obtener los datos del usuario.");
        return;
      }
    } else {
      setError("Error: No se encontró la ID del usuario.");
      return;
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchFriends = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Search/SearchAmigos/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`, // Añadimos el token JWT
          },
          body: JSON.stringify({ apodo: searchTerm.trim() || "" }), // Filtramos por apodo si hay búsqueda
        });

        if (!response.ok) {
          throw new Error(`Error al obtener la lista de amigos. Código HTTP: ${response.status}`);
        }

        const data: Friend[] = await response.json();
        setFriends(data);
      } catch (error) {
        setError("No se pudo obtener la lista de amigos: " + (error instanceof Error ? error.message : "Desconocido"));
      }
    };

    fetchFriends();
  }, [userId, searchTerm]); // Añadimos searchTerm como dependencia para filtrar dinámicamente

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar a este amigo?")) {
      try {
        // Aquí deberías hacer una solicitud al backend para eliminar la amistad
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_URL}/api/Friendships/Remove/${userId}/${friendId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error al eliminar al amigo");
        }

        setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
        alert("Amigo eliminado correctamente");
      } catch (error) {
        setError("Error al eliminar al amigo: " + (error instanceof Error ? error.message : "Desconocido"));
      }
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.apodo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Lista de Amigos</h2>

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
          {filteredFriends.map((friend) => (
            <li key={friend.id} className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
              <div className="flex items-center">
                <Image
                  src={friend.avatar?.startsWith("http") ? friend.avatar : `/images/${friend.avatar || "placeholder.svg"}`}
                  alt={friend.apodo}
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
                <button onClick={() => handleRemoveFriend(friend.id)} className="text-red-400 hover:text-red-200 mr-4">
                  Eliminar Amigo
                </button>
                <button onClick={() => onSelectFriend(friend)} className="bg-blue-500 text-white px-2 py-1 rounded">
                  Invitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="text-center mt-4">
        <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
          Cerrar
        </button>
      </div>
    </div>
  );
}