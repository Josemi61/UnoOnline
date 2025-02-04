"use client";

import { createContext, useState, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string | number;
  apodo: string;
  email: string;
  avatar: File | string;
}


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUserData: (updatedUser: User) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("authToken");

      console.log("storedUser:", storedUser); // Depuración
      console.log("storedToken:", storedToken); // Depuración

      if (storedUser && storedToken) {
        try {
          if (storedUser !== "undefined" && storedUser !== "null") {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log("Usuario cargado desde localStorage:", parsedUser); // Depuración
          } else {
            console.warn("No hay usuario válido en localStorage");
          }
        } catch (error) {
          console.error("Error al analizar el usuario de localStorage:", error);
          logout(); // Si hay un error, deslogueamos al usuario
        }
      } else {
        console.warn("No hay datos de usuario o token en localStorage");
      }
    }
  }, []);

  const login = (userData: User, token: string) => {
    console.log("Guardando en localStorage:", userData, token); // Depuración
    setUser(userData);
    setIsAuthenticated(true);

    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userData));

    router.push("/"); // Redirigir a la página principal después de login
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    router.push("/"); // Redirigir a la página de login o inicio
  };

  const updateUserData = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
