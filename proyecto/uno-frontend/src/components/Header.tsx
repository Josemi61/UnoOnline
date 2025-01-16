'use client'

import { UserCircle } from 'lucide-react'
import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function Header() {
  const [showOptions, setShowOptions] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)

  return (
    <header className="fixed bottom-4 right-4">
      <div className="relative">
        <button 
          onClick={() => setShowOptions(!showOptions)}
          className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
        >
          <UserCircle size={20} />
        </button>
        
        {showOptions && (
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => {
                setShowLoginForm(true)
                setShowRegisterForm(false)
                setShowOptions(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => {
                setShowRegisterForm(true)
                setShowLoginForm(false)
                setShowOptions(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Registrarse
            </button>
          </div>
        )}
        
        {showLoginForm && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden">
            <LoginForm />
          </div>
        )}
        
        {showRegisterForm && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden">
            <RegisterForm />
          </div>
        )}
      </div>
    </header>
  )
}

