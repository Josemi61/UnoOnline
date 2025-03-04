"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/Authprovider";
import { useRouter } from "next/navigation";



interface UserProfileData {
  id: string;
  avatar: string;
  apodo: string;
  email: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7201";

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { socket } = useWebSocket();
  const { user } = useAuth();
  const router = useRouter();

  const currentUserId = user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileResponse = await fetch(`${API_URL}/api/User/${userId}`);

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);
      } catch (err) {
        setError("Error al cargar los datos del usuario");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleFriendAction = () => {
    if (!profile) return;

    if (profile.isFriend) {
      if (confirm("¿Estás seguro de que quieres dejar de ser amigo de este usuario?")) {
        if (socket && socket.readyState === WebSocket.OPEN) {
          const message = `RemoveFriend|${currentUserId},${userId}`;
          socket.send(message);
          setProfile({ ...profile, isFriend: false });
        }
      }
    } else if (!profile.hasPendingRequest) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        const message = `FriendRequest|${currentUserId},${userId}`;
        socket.send(message);
        setProfile({ ...profile, hasPendingRequest: true });
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-8 text-white">Cargando perfil...</div>;
  }

  if (error || !profile) {
    return <div className="text-center p-8 text-red-500">{error || "Error al cargar el perfil"}</div>;
  }
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 overflow-y-auto z-50">
        <div className="bg-gray-800 text-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center text-center">
            <Image
              src={profile.avatar}
              alt={`Avatar de ${profile.apodo}`}
              width={80}
              height={80}
              className="rounded-full"
              unoptimized
            />
            <h3 className="text-2xl font-semibold mt-3">{profile.apodo}</h3>
            <p className="text-gray-400">{profile.email}</p>

            {profile.id !== currentUserId && (
              <button
                onClick={handleFriendAction}
                className={`w-full font-bold py-2 px-4 rounded-lg transition-colors mt-4 ${
                  profile.isFriend
                    ? "bg-red-500 hover:bg-red-600"
                    : profile.hasPendingRequest
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                disabled={profile.hasPendingRequest}
              >
                {profile.isFriend ? "Dejar de ser amigos" : profile.hasPendingRequest ? "Solicitud enviada" : "Enviar solicitud de amistad"}
              </button>
            )}

            {user?.role === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
