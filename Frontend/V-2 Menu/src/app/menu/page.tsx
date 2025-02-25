"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import UserProfile from "@/components/UserProfile"
import FriendsList from "@/components/FriendsList"
import UserSearchModal from "@/components/UserSearchModal"
import RequestsModal from "@/components/RequestsModal"
import GameStats from "@/components/GameStats"

export default function MenuPage() {
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [showRequests, setShowRequests] = useState(false)
  const [showFriendsList, setShowFriendsList] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    router.push("/")
  }

  const handlePlay = () => {
    router.push("/matchmaking")
  }

  const handlePlayWithFriends = () => {
    router.push("/matchmaking?mode=friends")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <UserProfile 
          onLogout={handleLogout} 
          user={{
            avatar: "",
            nickname: ""
          }} 
        />

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => setShowFriendsList(!showFriendsList)}
            className="text-2xl font-bold hover:text-yellow-300 transition-colors"
          >
            {showFriendsList ? "Ocultar Amigos" : "Mostrar Amigos"}
          </button>
          <button
            onClick={() => setShowUserSearch(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Buscar Usuarios
          </button>
        </div>

        {showFriendsList && (
          <FriendsList 
            onSelectFriend={() => {}} 
            onClose={() => setShowFriendsList(false)} 
          />
        )}

        <GameStats 
          stats={{
            connectedPlayers: 0,
            activeGames: 0,
            playersInGames: 0
          }} 
        />

        {/* Sección de botones "Jugar" */}
        <div className="mt-8 flex justify-center space-x-8">
          <button
            onClick={handlePlay}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-full text-xl"
          >
            Jugar UNO
          </button>
          <button
            onClick={handlePlayWithFriends}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-full text-xl"
          >
            Jugar x
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setShowRequests(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Ver Solicitudes e Invitaciones
          </button>
        </div>
      </div>

      {showUserSearch && <UserSearchModal onClose={() => setShowUserSearch(false)} />}
      {showRequests && <RequestsModal onClose={() => setShowRequests(false)} />}
    </div>
  )
}
