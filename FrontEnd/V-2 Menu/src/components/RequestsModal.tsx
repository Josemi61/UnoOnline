"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Request {
  id: string;
  type: "friend";
  from: {
    id: string;
    avatar: string;
    nickname: string;
  };
}

export default function RequestsModal({ onClose, userId }: { onClose: () => void; userId?: string }) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(userId);

  useEffect(() => {
    // Si userId es undefined, intenta obtenerlo de localStorage
    if (!resolvedUserId) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id) {
            setResolvedUserId(parsedUser.id.toString()); // Asegurar que es string
            console.log("✅ userId obtenido de localStorage:", parsedUser.id);
          } else {
            console.warn("⚠️ El usuario en localStorage no tiene ID válido.");
          }
        } catch (error) {
          console.error("❌ Error al parsear usuario desde localStorage:", error);
        }
      } else {
        console.warn("⚠️ No hay usuario en localStorage.");
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!resolvedUserId) {
      console.error("⚠️ userId sigue sin estar definido, evitando fetch y WebSocket.");
      return;
    }

    // ✅ Cargar solicitudes pendientes desde la API
    const fetchPendingRequests = async () => {
      try {
        const response = await fetch(`https://localhost:7201/api/friendsPending/${resolvedUserId}`);
        if (!response.ok) throw new Error("Error al obtener las solicitudes pendientes.");
        const data = await response.json();

        // ✅ Transformar datos al formato adecuado
        const formattedRequests = data.map((req: any) => ({
          id: req.id,
          type: "friend",
          from: {
            id: req.senderId,
            avatar: req.senderAvatar || "/default-avatar.png",
            nickname: req.senderApodo,
          },
        }));

        setRequests(formattedRequests);
      } catch (error) {
        console.error("❌ Error al cargar solicitudes pendientes:", error);
      }
    };

    fetchPendingRequests();

    // ✅ Establecer conexión WebSocket solo si userId está definido
    const ws = new WebSocket(`wss://localhost:7201/api/websocket/connect?userId=${resolvedUserId}`);

    ws.onopen = () => {
      console.log("✅ WebSocket conectado correctamente.");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const [type, data] = event.data.split("|");

        if (type === "FriendRequest") {
          const [senderId, receiverId, senderNickname, senderAvatar] = data.split(",");

          if (receiverId === resolvedUserId) {
            setRequests((prevRequests) => [
              ...prevRequests,
              {
                id: `friend-request-${Date.now()}`,
                type: "friend",
                from: {
                  id: senderId,
                  avatar: senderAvatar || "/default-avatar.png",
                  nickname: senderNickname,
                },
              },
            ]);
            console.log("📨 Nueva solicitud de amistad recibida de:", senderId);
          }
        }
      } catch (error) {
        console.error("❌ Error procesando mensaje WebSocket:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ Error en WebSocket:", error);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket cerrado.");
    };

    return () => {
      ws.close();
    };
  }, [resolvedUserId]);

  // ✅ Manejo de aceptar o rechazar solicitud con WebSocket
  const handleAcceptOrReject = (requestId: string, accepted: boolean) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("🚨 WebSocket no está conectado.");
      return;
    }

    const message = `FriendRequestResponse|${requestId},${accepted}`;
    socket.send(message);
    console.log(`📨 Enviando respuesta de solicitud de amistad: ${message}`);

    setRequests((prevRequests) => prevRequests.filter((r) => r.id !== requestId));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Solicitudes de Amistad</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No tienes solicitudes pendientes.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((request) => (
              <li key={request.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src={request.from.avatar || "/default-avatar.png"}
                    alt={request.from.nickname}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <span className="font-bold text-gray-800">{request.from.nickname}</span>
                    <p className="text-sm text-gray-600">Solicitud de amistad</p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => handleAcceptOrReject(request.id, true)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-sm mr-2"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleAcceptOrReject(request.id, false)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-sm"
                  >
                    Rechazar
                  </button>
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
    </div>
  );
}
