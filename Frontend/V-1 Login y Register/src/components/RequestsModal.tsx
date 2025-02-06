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

export default function RequestsModal({ onClose }: { onClose: () => void }) {
  const [requests, setRequests] = useState<Request[]>([])
  const router = useRouter()

  useEffect(() => {
    // Fetch requests
    // This is a placeholder and should be replaced with an actual API call
    const fetchRequests = async () => {
      const mockRequests: Request[] = [
      ]
      setRequests(mockRequests)
    }
    fetchRequests()
  }, [])

  const handleAccept = async (request: Request) => {
    if (request.type === "friend") {
      // Accept friend request logic
      // This is a placeholder and should be replaced with an actual API call
      setRequests(requests.filter((r) => r.id !== request.id))
    } else if (request.type === "game") {
      // Accept game invitation logic
      // This is a placeholder and should be replaced with an actual API call
      router.push("/matchmaking")
    }
  }

  const handleReject = async (requestId: string) => {
    // Reject request logic
    // This is a placeholder and should be replaced with an actual API call
    setRequests(requests.filter((r) => r.id !== requestId))
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

