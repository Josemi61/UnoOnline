'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica de autenticación
    // Si las credenciales son correctas, redirigir al usuario
    router.push('/menu')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4">
        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
          Apodo o Correo electrónico
        </label>
        <input
          type="text"
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
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
  )
}

