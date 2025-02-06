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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Obtener userId desde localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.id) {
          setUserId(parsedUser.id.toString()); // Convertir a string
          console.log("✅ userId obtenido de localStorage:", parsedUser.id);
        } else {
          console.warn("⚠️ No se encontró un userId válido en localStorage.");
          setError("Error: No se encontró la ID del usuario.");
          return;
        }
      } catch (error) {
        console.error("❌ Error al parsear usuario desde localStorage:", error);
        setError("Error al obtener los datos del usuario.");
        return;
      }
    } else {
      console.warn("⚠️ No hay usuario guardado en localStorage.");
      setError("Error: No se encontró la ID del usuario.");
      return;
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchFriends = async () => {
      try {
        console.log(`🔎 Buscando amigos con userId: ${userId}`);
        const response = await fetch(`${API_URL}/api/Search/SearchAmigos/${userId}`, {
          method: "POST", // ✅ Corregido a GET
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
          body: JSON.stringify({ apodo: searchTerm.trim() || "" }),
        });

        if (!response.ok) {
          throw new Error(`Error al obtener la lista de amigos. Código HTTP: ${response.status}`);
        }

        const data: Friend[] = await response.json();
        console.log("Amigos recibidos:", data);
        setFriends(data);
      } catch (error) {
        console.error("Error al obtener amigos:", error);
        setError("No se pudo obtener la lista de amigos.");
      }
    };

    fetchFriends();
  }, [userId]);

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar a este amigo?")) {
      try {
        setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
      } catch (error) {
        console.error("❌ Error al eliminar amigo:", error);
      }
    }
  };

  const filteredFriends = friends.filter((friend) =>
    (friend.apodo || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(
        searchTerm
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      )
  );

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
          {filteredFriends.map((friend) => (
            <li key={friend.id} className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
              <div className="flex items-center">
                {/* Handle avatar image rendering */}
                <Image
                  src={
                    friend.avatar?.startsWith("http")
                      ? friend.avatar
                      : `/images/${friend.avatar || "placeholder.svg"}`
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
