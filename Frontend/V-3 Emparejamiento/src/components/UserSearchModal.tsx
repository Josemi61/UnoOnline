"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useWebSocket } from "../context/WebSocketContext";

interface User {
  id: string;
  apodo: string;
  isFriend: boolean;
  hasSentRequest: boolean;
}

interface UserProfile {
  id: string;
  apodo: string;
  email: string;
  avatarUrl?: string;
  isFriend: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7201";

export default function UserSearchModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { socket } = useWebSocket();
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;

  // Fetch de usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/User`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            "Content-Type": "application/json",
            Accept: "*/*",
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener los usuarios: " + response.status);
        }

        const data = await response.json();
        let filteredUsers: User[] = [];
        if (userId && data.length > 0) {
          filteredUsers = data
            .filter((u: any) => u.id !== userId)
            .map((u: any) => ({
              id: u.id.toString(),
              apodo: u.apodo,
              isFriend: u.isFriend || false,
              hasSentRequest: u.hasSentRequest || false,
            }));
        } else {
          filteredUsers = data.map((u: any) => ({
            id: u.id.toString(),
            apodo: u.apodo,
            isFriend: u.isFriend || false,
            hasSentRequest: u.hasSentRequest || false,
          }));
        }

        setUsers(filteredUsers);
        setError(filteredUsers.length === 0 ? "No se encontraron usuarios" : null);
      } catch (error) {
        setUsers([]);
        setError("Error al buscar usuarios: " + (error instanceof Error ? error.message : "Desconocido"));
      }
    };

    fetchUsers();
  }, [userId]);

  // Filtrado local por término de búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter((user) =>
        user.apodo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsers(filtered);
    }
  }, [searchTerm]);

  // Fetch del perfil del usuario seleccionado
  const handleViewProfile = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/User/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener el perfil");
      }

      const data = await response.json();
      setSelectedUser({
        id: data.id,
        apodo: data.apodo,
        email: data.email || "email@ejemplo.com",
        avatarUrl: data.avatarUrl || "https://via.placeholder.com/100",
        isFriend: data.isFriend || false,
      });
      setFriendRequestSent(data.hasSentRequest || false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSendFriendRequest = (targetUserId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = `FriendRequest|${userId},${targetUserId}`;
      socket.send(message);
      setFriendRequestSent(true);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === targetUserId ? { ...user, hasSentRequest: true } : user
        )
      );
    } else {
      setError("No se pudo enviar la solicitud, WebSocket no está conectado.");
    }
  };

  const handleRemoveFriend = () => {
    if (confirm("¿Estás seguro de que quieres eliminar a este amigo?")) {
      setSelectedUser((prev) => prev ? { ...prev, isFriend: false } : null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Buscar Usuarios</h2>

        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error ? (
          <p className="text-gray-500 text-sm text-center mt-2">{error}</p>
        ) : (
          <ul className="space-y-4 max-h-96 overflow-y-auto mt-2">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between">
                <span className="font-bold text-gray-800">{user.apodo}</span>
                <div>
                  <button
                    onClick={() => handleViewProfile(user.id)}
                    className="text-blue-500 hover:text-blue-700 mr-4"
                  >
                    Ver Perfil
                  </button>
                  {!user.isFriend && !user.hasSentRequest && (
                    <button
                      onClick={() => handleSendFriendRequest(user.id)}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-sm"
                    >
                      Enviar Solicitud
                    </button>
                  )}
                  {user.hasSentRequest && <span className="text-gray-500 text-sm">Solicitud Enviada</span>}
                  {user.isFriend && <span className="text-green-500 text-sm">Amigos</span>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onClose}
          className="mt-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Cerrar
        </button>
      </div>

{/* Modal de Perfil */}
{selectedUser && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative flex flex-col items-center text-black">
      
      {/* Botón de Cerrar */}
      <button
        onClick={() => setSelectedUser(null)}
        className="absolute top-5 right-5 text-gray-600 hover:text-gray-800 transition"
      >
        ✖
      </button>

      {/* Avatar y Datos */}
      <div className="flex flex-col items-center">
      <Image
  src={selectedUser.avatarUrl || "/images/default-avatar.png"}
  alt={selectedUser.apodo || "Avatar del usuario"}
  width={128}
  height={128}
  unoptimized={!!selectedUser.avatarUrl && selectedUser.avatarUrl.startsWith("http")} // Asegura que unoptimized sea true solo si es una URL externa
/>
        <h2 className="text-4xl font-bold mt-4">{selectedUser.apodo}</h2>
        <p className="text-lg mt-2">{selectedUser.email}</p>
      </div>

      {/* Botón de Solicitud de Amistad o Eliminar Amigo */}
      <div className="mt-6 w-full flex justify-center">
        {!selectedUser.isFriend ? (
          <button
            onClick={() => handleSendFriendRequest(selectedUser.id)}
            disabled={friendRequestSent}
            className={`px-6 py-3 rounded-full font-semibold transition text-lg ${
              friendRequestSent
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {friendRequestSent ? "Solicitud Enviada" : "Enviar Solicitud de Amistad"}
          </button>
        ) : (
          <button
            onClick={handleRemoveFriend}
            className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold transition text-lg"
          >
            Eliminar Amigo
          </button>
        )}
      </div>

      {/* Historial de Partidas */}
      <div className="mt-8 w-full">
        <button
          className="w-full text-left px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg flex justify-between items-center transition"
          onClick={() => setHistoryOpen(!historyOpen)}
        >
          <span>Historial de Partidas</span>
          <span>{historyOpen ? "▲" : "▼"}</span>
        </button>

        {historyOpen && (
          <div className="mt-5 border rounded-lg p-5 bg-gray-50 shadow-sm">
            {/* Controles de Orden y Paginación */}
            <div className="flex justify-between items-center mb-4">
              <select className="p-2 border rounded text-md text-black">
                <option>Ordenar por fecha</option>
                <option>Ordenar por resultado</option>
              </select>
              <div>
                <button className="px-3 py-1 border rounded text-md text-black">Anterior</button>
                <span className="mx-3 text-md font-semibold">Página 1</span>
                <button className="px-3 py-1 border rounded text-md text-black">Siguiente</button>
              </div>
            </div>

            {/* Tabla de Historial */}
            <table className="w-full border-collapse border border-gray-300 text-md text-black">
              <thead>
                <tr className="bg-gray-200 text-gray-800">
                  <th className="border p-3">Fecha</th>
                  <th className="border p-3">Resultado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3 text-center text-gray-500" colSpan={2}>
                    No hay partidas registradas
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Botón para Cerrar */}
      <button
        onClick={() => setSelectedUser(null)}
        className="mt-8 w-full bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-6 rounded-lg text-lg transition"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

    </div>

  );
}