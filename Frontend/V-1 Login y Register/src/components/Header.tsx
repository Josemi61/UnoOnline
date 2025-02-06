'use client'

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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
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
            <LoginForm onClose={() => setShowLoginForm(false)} />
          </div>
        )}
        
        {showRegisterForm && (
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden">
            <RegisterForm onClose={() => setShowRegisterForm(false)} />
          </div>
        )}
      </div>
    </header>
  )
}
