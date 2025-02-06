"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

interface User {
  id: string
  avatar: string
  nickname: string
  isFriend: boolean
  hasSentRequest: boolean
}

export default function UserSearchModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Fetch users
    // This is a placeholder and should be replaced with an actual API call
    const fetchUsers = async () => {
      const response = await fetch("")
      const data = await response.json()
      setUsers(
        data.map((user: any) => ({
          id: user.id.toString(),
          avatar: `https://avatars.dicebear.com/api/human/${user.id}.svg`,
          nickname: user.name,
          isFriend: Math.random() < 0.5,
          hasSentRequest: false,
        })),
      )
    }
    fetchUsers()
  }, [])

  const handleSendFriendRequest = async (userId: string) => {
    // Send friend request logic
    // This is a placeholder and should be replaced with an actual API call
    setUsers(users.map((user) => (user.id === userId ? { ...user, hasSentRequest: true } : user)))
  }

  const filteredUsers = users.filter((user) =>
    user.nickname
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(
        searchTerm
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      ),
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Buscar Usuarios</h2>
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded border border-gray-300 mb-4"
        />
        <ul className="space-y-4 max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <li key={user.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <Image
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.nickname}
                  width={48}
                  height={48}
                  className="rounded-full mr-4"
                />
                <span className="font-bold text-gray-800">{user.nickname}</span>
              </div>
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

