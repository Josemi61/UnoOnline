"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

interface Friend {
  id: string
  avatar: string
  nickname: string
  status: "connected" | "disconnected" | "playing"
}

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Fetch friends list
    // This is a placeholder and should be replaced with an actual API call
    const fetchFriends = async () => {
      const mockFriends: Friend[] = [
      ]
      setFriends(mockFriends)
    }
    fetchFriends()
  }, [])

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar a este amigo?")) {
      // Remove friend logic
      // This is a placeholder and should be replaced with an actual API call
      setFriends(friends.filter((friend) => friend.id !== friendId))
    }
  }

  const filteredFriends = friends.filter((friend) =>
    friend.nickname
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
    <div className="mt-4">
      <input
        type="text"
        placeholder="Buscar amigos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 rounded bg-white/10 text-white placeholder-gray-300 mb-4"
      />
      <ul className="space-y-4">
        {filteredFriends.map((friend) => (
          <li key={friend.id} className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
            <div className="flex items-center">
              <Image
                src={friend.avatar || "/placeholder.svg"}
                alt={friend.nickname}
                width={48}
                height={48}
                className="rounded-full mr-4"
              />
              <div>
                <h3 className="font-bold">{friend.nickname}</h3>
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
    </div>
  )
}

