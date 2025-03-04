"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/Authprovider";

export default function RegisterForm({ onClose }: { onClose: () => void }) {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validaciones
    if (!validateEmail(email)) {
      setError("Por favor, introduce un formato de email válido.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    const role = "user"; // Definimos el role como "user" automáticamente
    try {
      const formData = new FormData();
      formData.append("Id", "0"); // ID predeterminado en 0 como muestra Swagger
      formData.append("Apodo", nickname);
      formData.append("Email", email);
      formData.append("Password", password);
      formData.append("Role", role); // Añadimos el role como "user" automáticamente
      if (avatar) {
        formData.append("Avatar", avatar);
      }

      const response = await fetch("https://localhost:7201/api/User/register", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error en el registro.");
      }

      const data = await response.json();

      // Simulación de un token desde el backend
      const token = data.token || "dummyToken";

      // Guardar el usuario en el contexto, incluyendo el role
      login(
        {
          id: data.id || 0,
          apodo: data.apodo,
          email: data.email,
          avatar: avatar as File,
          role: "user", // Añadimos el role al objeto del usuario
        },
        token
      );

      console.log("Usuario registrado:", data);
      alert("Registro exitoso");
      onClose(); // Cerrar el formulario
      // router.push(""); // Redirigir al menú
    } catch (err: unknown) {
      console.error("Error detallado:", err);
      if (err instanceof Error) {
        setError(
          err.message.includes("Internal server error")
            ? "Error interno del servidor."
            : err.message
        );
      } else {
        setError("Error desconocido en el registro");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 relative">
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
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#1e6fbf] file:text-white hover:file:bg-[#1a5fa8]"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
          Apodo
        </label>
        <input
          type="text"
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e6fbf] focus:ring focus:ring-[#1e6fbf] focus:ring-opacity-50 text-gray-900"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirmar contraseña
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e6fbf] focus:ring focus:ring-[#1e6fbf] focus:ring-opacity-50 text-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          isLoading ? "bg-gray-400" : "bg-[#1e6fbf] hover:bg-[#1a5fa8]"
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e6fbf]`}
      >
        {isLoading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
}