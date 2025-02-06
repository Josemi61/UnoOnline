"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/Authprovider"; // Importar el contexto
import { jwtDecode } from "jwt-decode";
import { User } from "../context/Authprovider";

interface DecodedToken {
  Id: number;
  Apodo: string;
  Email: string;
  Avatar: string;
}

export default function LoginForm({ onClose }: { onClose: () => void }) {
  const { login } = useAuth(); // Usar el hook de contexto para almacenar el usuario
  const [identificador, setIdentificador] = useState(""); // Usuario o correo
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Estado para la conexión WebSocket
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Enviando datos:", { identificador, password });

      const response = await fetch("https://localhost:7201/api/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error Data:", errorData);
        throw new Error(errorData.message || "Error en el inicio de sesión");
      }

      const data = await response.json();
      const decodedToken = jwtDecode<DecodedToken>(data.accessToken);

      console.log("Token Decodificado:", decodedToken);

      const user: User = {
        id: decodedToken.Id,
        apodo: decodedToken.Apodo,
        email: decodedToken.Email,
        avatar: decodedToken.Avatar,
      };

      // Guardar usuario en el contexto
      login(user, data.accessToken);

      // Conectar a WebSocket y actualizar estado
      const ws = new WebSocket("wss://localhost:7201/ws"); // Reemplaza con la URL correcta de tu WebSocket

      ws.onopen = () => {
        console.log("✅ WebSocket conectado");
        const statusMessage = `StatusUpdate|${user.id},1`; // Estado 1 = Conectado
        ws.send(statusMessage);
        console.log("📤 Estado de conexión enviado:", statusMessage);
      };

      ws.onerror = (error) => {
        console.error("❌ Error en WebSocket:", error);
      };

      ws.onclose = () => {
        console.log("🔴 WebSocket desconectado");
      };

      setSocket(ws); // Guardamos la conexión en el estado

      // Cerrar modal y redirigir
      onClose();
      router.push("/menu");
    } catch (error) {
      console.error("Error detallado:", error);
      if (error instanceof Error) {
        setError(error.message || "Error desconocido en el inicio de sesión");
      } else {
        setError("Error desconocido en el inicio de sesión");
      }
      alert(error instanceof Error ? error.message : "Error desconocido");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 relative">
      <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label htmlFor="identificador" className="block text-sm font-medium text-gray-700">
          Usuario o Correo Electrónico
        </label>
        <input
          type="text"
          id="identificador"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e6fbf] focus:ring focus:ring-[#1e6fbf] focus:ring-opacity-50 text-gray-900"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e6fbf] focus:ring focus:ring-[#1e6fbf] focus:ring-opacity-50 text-gray-900"
        />
      </div>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
            className="rounded border-gray-300 text-[#1e6fbf] shadow-sm focus:border-[#1e6fbf] focus:ring focus:ring-[#1e6fbf] focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-600">Mantener sesión iniciada</span>
        </label>
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1e6fbf] hover:bg-[#1a5fa8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e6fbf]"
      >
        Iniciar sesión
      </button>
    </form>
  );
}
