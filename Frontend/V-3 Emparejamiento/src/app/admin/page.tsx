"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface User {
  id: string | number;
  apodo: string;
  email: string;
  avatar: string;
  role: "admin" | "user";
  status?: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null); // Estado para el usuario en edición
  const router = useRouter();

  // Verificar si el usuario es admin y obtener usuarios
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");

    if (!storedUser || !token) {
      router.push("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "admin") {
        router.push("/");
        return;
      }
      setIsAdmin(true);
    } catch (err) {
      console.error("Error al verificar el rol:", err);
      router.push("/");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch("https://localhost:7201/api/User", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Error al obtener los usuarios");
        }

        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  // Cambiar rol de usuario directamente desde el dropdown (ya no necesario aquí, pero mantenemos la función para el formulario)
  const handleRoleChange = async (userId: string | number, newRole: "admin" | "user") => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`https://localhost:7201/api/User/UpdateUserRole/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el rol");
      }

      setUsers(users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      alert("Rol actualizado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el rol");
    }
  };

  // Banear usuario
  const handleBan = async (userId: string | number) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`https://localhost:7201/api/User/${userId}/0`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Error al banear al usuario");
      }

      setUsers(users.map((user) =>
        user.id === userId ? { ...user, status: 0 } : user
      ));
      alert("Usuario baneado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al banear al usuario");
    }
  };

  // Abrir formulario de edición
  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  // Cerrar formulario de edición
  const closeEditForm = () => {
    setEditingUser(null);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/90 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Avatar</th>
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Nombre</th>
                <th className="py-3 px-6 text-left">Correo</th>
                <th className="py-3 px-6 text-left">Rol</th>
                <th className="py-3 px-6 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-900 text-sm font-light">
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-300 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left">
                    <Image
                      src={`https://localhost:7201/images/${user.avatar}` || "/images/default-avatar.png"}
                      alt={user.apodo}
                      width={40}
                      height={40}
                      className="rounded-full"
                      unoptimized
                    />
                  </td>
                  <td className="py-3 px-6 text-left">{user.id}</td>
                  <td className="py-3 px-6 text-left">{user.apodo}</td>
                  <td className="py-3 px-6 text-left">{user.email}</td>
                  <td className="py-3 px-6 text-left">{user.role === "admin" ? "Admin" : "User"}</td>
                  <td className="py-3 px-6 text-left space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleBan(user.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
                    >
                      Banear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingUser && (
          <EditUserForm user={editingUser} onClose={closeEditForm} setUsers={setUsers} users={users} />
        )}
      </div>
    </div>
  );
}

// Componente para el formulario de edición
function EditUserForm({
  user,
  onClose,
  setUsers,
  users,
}: {
  user: User;
  onClose: () => void;
  setUsers: (users: User[]) => void;
  users: User[];
}) {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [apodo, setApodo] = useState(user.apodo);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<string>(user.role); // Usamos string para mantener consistencia con el backend
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("Id", user.id.toString());
      formData.append("Apodo", apodo);
      formData.append("Email", email);
      formData.append("Role", role); // Enviamos role como string
      if (avatar) {
        formData.append("Avatar", avatar);
      }

      const token = localStorage.getItem("authToken");
      const response = await fetch("https://localhost:7201/api/User/UpdateUser", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al actualizar el usuario");
      }

      const updatedUser = await response.json();
      setUsers(users.map((u) =>
        u.id === user.id ? { ...u, apodo, email, role: updatedUser.role || role, avatar: updatedUser.avatar || u.avatar } : u
      ));
      alert("Usuario actualizado correctamente");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
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
        <h2 className="text-lg font-medium mb-4">Editar Usuario</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">ID</label>
          <input
            type="text"
            value={user.id}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-900"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Avatar</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files ? e.target.files[0] : null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-gray-900"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-gray-900"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)} // Usamos string directamente
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-50 text-gray-900"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600`}
        >
          {isLoading ? "Actualizando..." : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}