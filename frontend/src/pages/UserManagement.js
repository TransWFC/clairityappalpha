import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavbarComponent from "../components/NavbarComponent"; // Asegúrate de que la ruta es correcta
import "../Estilos/userManagement.css";
import SidebarComponent from "../components/SidebarComponent";

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [updatedUser, setUpdatedUser] = useState({ name: "", email: "", password: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login");
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      setError("Error al obtener los usuarios");
    }
  };

  const handleInputChange = (e, setState) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateEmail = async (email) => {
    try {
      const response = await axios.get(`/api/users?email=${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.exists;
    } catch (err) {
      return false;
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!validatePassword(newUser.password)) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales.");
      return;
    } else {
      setPasswordError("");
    }

    try {
      await axios.post("/api/users", newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemporaryMessage("Usuario creado exitosamente.", "success");
      setNewUser({ name: "", email: "", password: "" });
      fetchUsers();
    } catch (err) {
      setTemporaryError("Error al crear el usuario");
    }
  };

  const handleUpdateSelect = (user) => {
    setSelectedUser(user);
    setUpdatedUser({
      name: user.name || "",
      email: user.email || "",
      password: "", // Dejar vacío para que no se muestre como si fuera obligatorio
    });
  };

  const updateUser = async (e) => {
    e.preventDefault();

    // Solo valida la contraseña si ha sido modificada
    if (updatedUser.password && !validatePassword(updatedUser.password)) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales.");
      return;
    } else {
      setPasswordError("");
    }

    if (updatedUser.email !== selectedUser.email) {
      const emailExists = await validateEmail(updatedUser.email);
      if (emailExists) {
        setEmailError("El correo electrónico ya está registrado.");
        return;
      } else {
        setEmailError("");
      }
    }

    const updatedData = {
      name: updatedUser.name, // Solo actualiza el nombre
      email: updatedUser.email === selectedUser.email ? undefined : updatedUser.email, // Solo actualiza el email si ha cambiado
      password: updatedUser.password || undefined, // Solo actualiza la contraseña si el campo no está vacío
    };

    try {
      await axios.put(`/api/users/${selectedUser._id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemporaryMessage("Usuario actualizado correctamente", "success");
      setSelectedUser(null);  // Limpiar selección después de la actualización
      fetchUsers();  // Actualizar la lista de usuarios
    } catch (err) {
      setTemporaryError("Error al actualizar el usuario");
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemporaryMessage("Usuario eliminado exitosamente", "success");
      fetchUsers();
    } catch (err) {
      setTemporaryError("Error al eliminar el usuario");
    }
  };

  const deactivateUser = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemporaryMessage("Usuario desactivado correctamente", "success");
      fetchUsers();
    } catch (err) {
      setTemporaryError("Error al desactivar el usuario");
    }
  };

  const activateUser = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemporaryMessage("Usuario activado correctamente", "success");
      fetchUsers();
    } catch (err) {
      setTemporaryError("Error al activar el usuario");
    }
  };

  const setTemporaryMessage = (message, type) => {
    setMessage(message);
    setTimeout(() => setMessage(""), 5000);
  };

  const setTemporaryError = (message) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  return (
    <div style={{ marginTop: '60px' }}>
      <NavbarComponent />

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <SidebarComponent />

        <div className="p-4 max-w-lg mx-auto w-full">
          <h1 className="text-xl font-bold mb-4">Gestión de Usuarios</h1>
          {message && <p className="text-green-500">{message}</p>}
          {error && <p className="text-red-500">{error}</p>}

          {/* Formulario para crear un usuario */}
          <form onSubmit={createUser} className="mb-4">
            <input className="border p-2 w-full mb-2" type="text" name="name" placeholder="Nombre" value={newUser.name} onChange={(e) => handleInputChange(e, setNewUser)} required />
            <input className="border p-2 w-full mb-2" type="email" name="email" placeholder="Correo" value={newUser.email} onChange={(e) => handleInputChange(e, setNewUser)} required />
            <input className="border p-2 w-full mb-2" type="password" name="password" placeholder="Contraseña" value={newUser.password} onChange={(e) => handleInputChange(e, setNewUser)} required />
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            <button type="submit" className="btn-create-user w-full py-2 mt-4">Crear Usuario</button>
          </form>

          {/* Lista de usuarios */}
          <h2 className="text-lg font-semibold mb-2">Lista de Usuarios</h2>
          <ul>
            {users.map((user) => (
              <li key={user._id} className="border p-2 mb-2 flex justify-between items-center">
                <p>{user.name} ({user.email})</p>
                <div>
                  <button className="btn-update mx-1" onClick={() => handleUpdateSelect(user)}>Editar</button>
                  <button className="btn-delete mx-1" onClick={() => deleteUser(user._id)}>Eliminar</button>
                  {user.status === "active" ? (
                    <button className="btn-deactivate mx-1" onClick={() => deactivateUser(user._id)}>Desactivar</button>
                  ) : (
                    <button className="btn-activate mx-1" onClick={() => activateUser(user._id)}>Activar</button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Modal para actualizar usuario */}
          {selectedUser && (
            <div style={{ position: "fixed", top: "0", left: "0", right: "0", bottom: "0", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "5px", width: "400px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)" }}>
                <h2 className="text-lg font-semibold mb-2">Editar Usuario</h2>
                <form onSubmit={updateUser}>
                  <input className="border p-2 w-full mb-2" type="text" name="name" placeholder="Nombre" value={updatedUser.name || selectedUser.name} onChange={(e) => handleInputChange(e, setUpdatedUser)} />
                  <input className="border p-2 w-full mb-2" type="email" name="email" placeholder="Correo" value={updatedUser.email || selectedUser.email} onChange={(e) => handleInputChange(e, setUpdatedUser)} />
                  <input className="border p-2 w-full mb-2" type="password" name="password" placeholder="Contraseña" value={updatedUser.password || ""} onChange={(e) => handleInputChange(e, setUpdatedUser)} />
                  {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                  <button type="submit" className="btn-create-user w-full py-2 mt-4">Actualizar Usuario</button>
                </form>
                <button onClick={() => setSelectedUser(null)} className="btn-close-modal w-full py-2 mt-4">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
