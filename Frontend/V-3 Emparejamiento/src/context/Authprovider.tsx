"use client";

import { createContext, useState, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// Interfaz User con el rol
export interface User {
  id: string | number;
  apodo: string;
  email: string;
  avatar: File | string;
  role: "admin" | "user";
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

      console.log("storedUser:", storedUser);
      console.log("storedToken:", storedToken);

      if (storedUser && storedToken) {
        try {
          if (storedUser !== "undefined" && storedUser !== "null") {
            const parsedUser: User = JSON.parse(storedUser);
            // Verificamos que el role sea válido
            if (parsedUser.role !== "admin" && parsedUser.role !== "user") {
              parsedUser.role = "user"; // Por defecto user si no es válido
            }
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log("Usuario cargado desde localStorage:", parsedUser);
          } else {
            console.warn("No hay usuario válido en localStorage");
          }
        } catch (error) {
          console.error("Error al analizar el usuario de localStorage:", error);
          logout();
        }
      } else {
        console.warn("No hay datos de usuario o token en localStorage");
      }
    }
  }, []);

  const login = (userData: User, token: string) => {
    console.log("Guardando en localStorage:", userData, token);
    
    // Decodificar el token para extraer el rol
    let roleFromToken: "admin" | "user" = "user"; // Valor por defecto
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decodificar la parte del payload del JWT
      const role = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      roleFromToken = role === "admin" ? "admin" : "user"; // Validar el rol del token
    } catch (error) {
      console.warn("Error al decodificar el token, usando rol por defecto 'user':", error);
    }

    // Combinar userData con el rol del token
    const userWithRole: User = {
      ...userData,
      role: roleFromToken, // Priorizamos el rol del token
    };

    setUser(userWithRole);
    setIsAuthenticated(true);

    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(userWithRole));

    router.push("/");
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    router.push("/");
  };

  const updateUserData = (updatedUser: User) => {
    // Aseguramos que el role sea válido al actualizar
    const userWithValidRole: User = {
      ...updatedUser,
      role: updatedUser.role === "admin" ? "admin" : "user"
    };
    setUser(userWithValidRole);
    localStorage.setItem("user", JSON.stringify(userWithValidRole));
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