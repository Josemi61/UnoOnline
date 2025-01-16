'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterForm() {
  const [avatar, setAvatar] = useState<File | null>(null)
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }
    // Aquí iría la lógica de registro
    // Si el registro es exitoso, redirigir al usuario
    router.push('/menu')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4">
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
          Imagen de perfil
        </label>
        <input
          type="file"
          id="avatar"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files ? e.target.files[0] : null)}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-[#1e6fbf] file:text-white
            hover:file:bg-[#1a5fa8]"
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
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1e6fbf] hover:bg-[#1a5fa8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e6fbf]"
      >
        Registrarse
      </button>
    </form>
  )
}

