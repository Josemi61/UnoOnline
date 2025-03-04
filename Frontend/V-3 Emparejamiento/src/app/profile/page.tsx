// pages/profile/[id].tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7201";

interface UserProfile {
  id: string;
  apodo: string;
  email: string;
  avatarUrl?: string;
  isFriend: boolean;
}

export default function UserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/User/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener el perfil");
        }

        const data = await response.json();
        setProfile({
          id: data.id,
          apodo: data.apodo,
          email: data.email || "email@ejemplo.com", // Valor estático si no viene del API
          avatarUrl: data.avatarUrl || "https://via.placeholder.com/100", // Avatar por defecto
          isFriend: data.isFriend || false,
        });
        setFriendRequestSent(data.hasSentRequest || false);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleFriendRequest = () => {
    // Simulación de envío de solicitud (en producción usaría WebSocket o API)
    setFriendRequestSent(true);
  };

  const handleRemoveFriend = () => {
    if (confirm("¿Estás seguro de que quieres eliminar a este amigo?")) {
      // Aquí iría la lógica para eliminar amigo
      setProfile((prev) => prev ? { ...prev, isFriend: false } : null);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!profile) return <div>No se encontró el usuario</div>;

  return (
    <div className="container mx-auto max-w-2xl p-4">
      {/* Perfil */}
      <div className="flex items-center gap-6 bg-white p-6 rounded-lg shadow">
        <img
          src={profile.avatarUrl}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.apodo}</h1>
          <p className="text-gray-600">{profile.email}</p>
          {!profile.isFriend && (
            <button
              onClick={handleFriendRequest}
              disabled={friendRequestSent}
              className={`mt-2 px-4 py-2 rounded ${
                friendRequestSent
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {friendRequestSent ? "Solicitud Enviada" : "Enviar Solicitud de Amistad"}
            </button>
          )}
          {profile.isFriend && (
            <button
              onClick={handleRemoveFriend}
              className="mt-2 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar Amigo
            </button>
          )}
        </div>
      </div>

      {/* Historial de partidas */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div
          className="p-4 bg-gray-100 cursor-pointer"
          onClick={() => setHistoryOpen(!historyOpen)}
        >
          <h2 className="text-xl font-semibold">Historial de Partidas</h2>
        </div>
        {historyOpen && (
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <select className="p-2 border rounded">
                <option>Ordenar por fecha</option>
                <option>Ordenar por resultado</option>
              </select>
              <div>
                <button className="px-2 py-1 border rounded">Anterior</button>
                <span className="mx-2">Página 1</span>
                <button className="px-2 py-1 border rounded">Siguiente</button>
              </div>
            </div>
            <p className="text-gray-500">No hay partidas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}