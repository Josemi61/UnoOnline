"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface Request {
  id: string
  type: "friend" | "game"
  from: {
    id: string
    avatar: string
    nickname: string
  }
}

export default function RequestsModal({ onClose, userId }: { onClose: () => void, userId: string }) {
  const [requests, setRequests] = useState<Request[]>([])
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const router = useRouter()

  useEffect(() => {
    const socket = new WebSocket("wss://localhost:7201/api/websocket/connect")
    
    socket.onopen = () => {
      console.log("🔗 WebSocket conectado correctamente.")
      setSocket(socket) // Establece el WebSocket cuando esté abierto
    }

    socket.onmessage = (event) => {
      const [type, data] = event.data.split("|")
      
      if (type === "FriendRequest") {
        const [senderId, receiverId] = data.split(",")
        
        // Reemplaza con el ID real del usuario receptor
        if (receiverId === userId) {
          // Aquí es donde deberías recuperar los detalles del remitente, como avatar y nickname
          // Esto podría hacerse a través de una API que devuelva los detalles del usuario que envió la solicitud
          setRequests((prevRequests) => [
            ...prevRequests,
            {
              id: `friend-request-${Date.now()}`, // ID único para la solicitud
              type: "friend",
              from: {
                id: senderId,
                avatar: "/default-avatar.png", // Reemplaza con la lógica real para obtener el avatar
                nickname: "Usuario de ejemplo", // Lo mismo para el nickname
              }
            }
          ])
          console.log("📨 Nueva solicitud de amistad recibida de:", senderId)
        }
      }
    }

    socket.onerror = (error) => {
      console.error("❌ Error en WebSocket:", error)
    }

    socket.onclose = (event) => {
      console.log("🔌 WebSocket cerrado", event)
    }

    return () => {
      socket.close()
    }
  }, [userId]) // Se asegura de que el efecto se ejecute cuando el userId cambie

  const handleAccept = async (request: Request) => {
    if (request.type === "friend") {
      setRequests(requests.filter((r) => r.id !== request.id))
      console.log(`Solicitud de amistad aceptada de: ${request.from.nickname}`)
      // Aquí agregarías la lógica de aceptación de la solicitud de amistad en el servidor
    } else if (request.type === "game") {
      router.push("/matchmaking")
    }
  }

  const handleReject = async (requestId: string) => {
    setRequests(requests.filter((r) => r.id !== requestId))
    console.log(`Solicitud rechazada: ${requestId}`)
    // Aquí agregarías la lógica de rechazo de la solicitud en el servidor
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Solicitudes e Invitaciones</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No tienes solicitudes ni invitaciones pendientes.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((request) => (
              <li key={request.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src={request.from.avatar || "/placeholder.svg"}
                    alt={request.from.nickname}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <span className="font-bold text-gray-800">{request.from.nickname}</span>
                    <p className="text-sm text-gray-600">
                      {request.type === "friend" ? "Solicitud de amistad" : "Invitación a jugar"}
                    </p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => handleAccept(request)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-sm mr-2"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
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
  )
}
