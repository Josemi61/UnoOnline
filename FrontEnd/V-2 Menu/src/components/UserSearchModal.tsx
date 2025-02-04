import { useState, useEffect } from "react"
import Link from "next/link"
import { useWebSocket } from "../context/WebSocketContext"  // Importa el WebSocket del contexto

interface User {
  id: string
  apodo: string
  isFriend: boolean
  hasSentRequest: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7201"

export default function UserSearchModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  const { socket } = useWebSocket(); // 📌 Usamos el WebSocket del contexto

  // Obtener el ID del usuario desde localStorage
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).id : null;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Search/Search/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
          body: JSON.stringify({ apodo: searchTerm.trim() || "" }),
        })

        if (!response.ok) {
          throw new Error("No se encuentran usuarios con esas restricciones")
        }

        let data: User[] = await response.json()

        console.log("Usuario autenticado:", userId) 
        console.log("Usuarios recibidos:", data) 

        if (data.length === 0) {
          setUsers([]) 
          setError("No se encuentran usuarios con esas restricciones")
        } else {
          setUsers(data)
          setError(null)
        }
      } catch (error) {
        setUsers([])
        setError("Error al buscar usuarios.")
      }
    }

    if (userId) {
      fetchUsers()
    }
  }, [searchTerm, userId])

  const handleSendFriendRequest = (targetUserId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("🔗 WebSocket está conectado")
      
      const message = `FriendRequest|${userId},${targetUserId}`;
      socket.send(message);
      console.log("📨 Mensaje enviado:", message);
    } else {
      console.error("❌ Error: WebSocket no está conectado");
      setError("No se pudo enviar la solicitud, WebSocket no está conectado.");
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
          aria-label="Buscar usuarios"
        />

        {error ? (
          <p className="text-gray-500 text-sm text-center mt-2">{error}</p>
        ) : (
          <ul className="space-y-4 max-h-96 overflow-y-auto mt-2">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between">
                <span className="font-bold text-gray-800">{user.apodo}</span>
                <div>
                  <Link href={`/profile/${user.id}`} className="text-blue-500 hover:text-blue-700 mr-4">
                    Ver Perfil
                  </Link>
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
    </div>
  )
}
