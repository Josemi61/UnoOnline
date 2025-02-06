"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/context/WebSocketContext";

export interface UserProfileProps {
  user: {
    avatar: string;
    apodo: string;
    email: string;
    id: string;
  };
  onLogout: () => void;
}

export default function UserProfile({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<UserProfileProps["user"] | null>(null);
  const [showEditForm, setShowEditForm] = useState(false); // Estado para controlar el modal
  const router = useRouter();
  const {messages} = useWebSocket();

  // Estado para manejar el WebSocket
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Recuperar datos del localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          avatar: `https://localhost:7201/images/${parsedUser.avatar}`,
          apodo: parsedUser.apodo,
          email: parsedUser.email,
          id: parsedUser.id,
        });
      } catch (error) {
        console.error("Error al analizar el usuario del localStorage:", error);
      }
    }
  }, []);

  // useEffect(() =>{
  //   console.log("mensaje recibido", messages);
  //  }, [messages])
  
  useEffect(() => {
    // Recuperar datos del usuario desde localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          avatar: `https://localhost:7201/images/${parsedUser.avatar}`,
          apodo: parsedUser.apodo,
          email: parsedUser.email,
          id: parsedUser.id,
        });
      } catch (error) {
        console.error("Error al analizar el usuario del localStorage:", error);
      }
    }
  }, []);
  
  

  const handleLogout = () => {
    // Verificar que tenemos una conexión WebSocket abierta
    if (socket) {
      // Crear el mensaje de actualización de estado a 'Desconectado' (0)
      const message = `StatusUpdate|${user?.id},0`;  // 0 representa el estado desconectado
      
      // Convertir el mensaje a bytes
      const bytes = new TextEncoder().encode(message);
  
      // Enviar el mensaje al servidor a través del WebSocket
      socket.send(bytes);
  
      console.log(`📤 Enviado mensaje de desconexión para el usuario ${user?.id}`);
    }
  
    // Borrar el localStorage
    localStorage.clear();
  
    // Redirigir a la página de inicio
    router.push("/");
  
    // Llamar a la función onLogout proporcionada, si es necesario
    if (onLogout) {
      onLogout();
    }
  
    // Cerrar el WebSocket si está abierto
    if (socket) {
      socket.close();
    }
  };
  

  const closeEditForm = () => {
    setShowEditForm(false);
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
    setShowEditForm(false);
  };

  if (!user) {
    return <p>Cargando datos del usuario...</p>;
  }

  return (
    <div className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
      <div className="flex items-center">
        <Image
          src={user.avatar || "/images/default-avatar.png"}
          alt={user.apodo || "Avatar del usuario"}
          width={64}
          height={64}
          className="rounded-full mr-4"
          unoptimized={user.avatar.startsWith("http")}
        />
        <div>
          <h1 className="text-2xl font-bold">{user.apodo}</h1>
          <p className="text-sm text-gray-300">{user.email}</p>
        </div>
      </div>
      <div>
        {/* Botón para abrir el formulario de edición */}
        <button
          onClick={() => setShowEditForm(true)}
          className="text-blue-300 hover:text-blue-100 mr-4"
        >
          Editar Perfil
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Cerrar Sesión
        </button>
      </div>
      {showEditForm && (
        <EditProfileForm
          onClose={closeEditForm}
          user={user}
          updateUser={updateUser}
        />
      )}
    </div>
  );
}

function EditProfileForm({
  onClose,
  user,
  updateUser,
}: {
  onClose: () => void;
  user: { avatar: string; apodo: string; email: string };
  updateUser: (user: any) => void;
}) {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [apodo, setApodo] = useState(user.apodo);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("Apodo", apodo);
      formData.append("Email", email);
      formData.append("Password", password);
      if (avatar) {
        formData.append("Avatar", avatar);
      }

      const response = await fetch("https://localhost:7201/api/User/update", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error en la actualización.");
      }

      const data = await response.json();

      // Actualiza el estado del usuario
      updateUser({
        avatar: avatar ? URL.createObjectURL(avatar) : user.avatar,
        apodo: apodo,
        email: email,
      });

      alert("Perfil actualizado correctamente");
    } catch (err: unknown) {
      console.error("Error detallado:", err);
      if (err instanceof Error) {
        setError(err.message || "Error desconocido.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md shadow-md w-96 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-lg font-medium mb-4">Editar Perfil</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
            Imagen de perfil
          </label>
          <input
            type="file"
            id="avatar"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files ? e.target.files[0] : null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="apodo" className="block text-sm font-medium text-gray-700">
            Apodo
          </label>
          <input
            type="text"
            id="apodo"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-gray-900"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-gray-900"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600`}
        >
          {isLoading ? "Actualizando..." : "Actualizar Perfil"}
        </button>
      </form>
    </div>
  );
}
