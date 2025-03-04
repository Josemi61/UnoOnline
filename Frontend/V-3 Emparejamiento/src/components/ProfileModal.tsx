"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7201";

interface UserProfile {
  id: string;
  apodo: string;
  email: string;
  avatar?: string;
  isFriend: boolean;
  hasSentRequest: boolean;
}

interface Match {
  id: string;
  date: string;
  result: string;
}

export default function ProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/User/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "application/json",
            Accept: "*/*",
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener el perfil del usuario");
        }

        const data = await response.json();
        setProfile({
          id: data.id.toString(),
          apodo: data.apodo,
          email: data.email,
          avatar: data.avatar || "/default-avatar.png", // Imagen por defecto si no hay avatar
          isFriend: data.isFriend || false,
          hasSentRequest: data.hasSentRequest || false,
        });
        setIsRequestSent(data.hasSentRequest || false);
      } catch (error) {
        setError("Error al cargar el perfil: " + (error instanceof Error ? error.message : "Desconocido"));
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSendFriendRequest = () => {
    // Aquí iría la lógica real de WebSocket, por ahora solo simulamos
    setIsRequestSent(true);
  };

  // Datos estáticos para el historial de partidas
  const staticMatches: Match[] = [
    { id: "1", date: "2025-03-01", result: "Victoria" },
    { id: "2", date: "2025-02-28", result: "Derrota" },
    { id: "3", date: "2025-02-27", result: "Victoria" },
  ];

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <p className="text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center space-x-4 mb-4">
          <Image
            src={profile.avatar || "/default-avatar.png"}
            alt="Avatar"
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{profile.apodo}</h2>
            <p className="text-gray-600">{profile.email}</p>
          </div>
        </div>

        {/* Botón de solicitud de amistad */}
        {!profile.isFriend && (
          <button
            onClick={handleSendFriendRequest}
            disabled={isRequestSent}
            className={`w-full py-2 px-4 rounded font-bold text-white ${
              isRequestSent
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isRequestSent ? "Solicitud Enviada" : "Enviar Solicitud de Amistad"}
          </button>
        )}

        {/* Historial de partidas desplegable */}
        <div className="mt-4">
          <button
            onClick={() => setShowMatches(!showMatches)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            {showMatches ? "Ocultar Historial" : "Mostrar Historial de Partidas"}
          </button>

          {showMatches && (
            <div className="mt-2">
              <ul className="space-y-2">
                {staticMatches.map((match) => (
                  <li key={match.id} className="border p-2 rounded">
                    <p>Fecha: {match.date}</p>
                    <p>Resultado: {match.result}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}