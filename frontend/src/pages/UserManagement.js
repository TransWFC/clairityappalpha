import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, Container, Row, Col, Button, Form, Alert, Modal, InputGroup } from "react-bootstrap";
import {
  BsPerson, BsPeople, BsPersonPlus, BsPersonCheck, BsPersonX, BsTrash, BsPencil,
  BsGrid, BsList, BsSearch, BsShield, BsPersonGear
} from "react-icons/bs";

import LayoutWithSidebar from "../components/LayoutWithSidebar";
import Footer from "../components/footer";
import "../Estilos/userManagement.css";

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", type: "user" });
  const [updatedUser, setUpdatedUser] = useState({ name: "", email: "", password: "", type: "user" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [userType, setUserType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login");
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setUserType(user.type);
    fetchUsers();
  }, [token, navigate]);

  useEffect(() => {
    const filtered = users.filter((u) =>
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.type || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch {
      setError("Error al obtener los usuarios");
    }
  };

  const handleInputChange = (e, setState) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);

  const validateEmail = async (email) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users?email=${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.exists;
    } catch {
      return false;
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!validatePassword(newUser.password)) {
      setPasswordError(
        "La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales."
      );
      return;
    }
    setPasswordError("");

    try {
      await axios.post("http://localhost:5000/api/users", newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemporaryMessage("Usuario creado exitosamente.");
      setNewUser({ name: "", email: "", password: "", type: "user" });
      fetchUsers();
    } catch {
      setTemporaryError("Error al crear el usuario");
    }
  };

  const handleUpdateSelect = (user) => {
    setSelectedUser(user);
    setUpdatedUser({
      name: user.name || "",
      email: user.email || "",
      password: "",
      type: user.type || "user",
    });
    setShowModal(true);
  };

  const updateUser = async (e) => {
    e.preventDefault();

    if (updatedUser.password && !validatePassword(updatedUser.password)) {
      setPasswordError(
        "La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales."
      );
      return;
    }
    setPasswordError("");

    if (updatedUser.email !== selectedUser.email) {
      const emailExists = await validateEmail(updatedUser.email);
      if (emailExists) {
        setEmailError("El correo electrónico ya está registrado.");
        return;
      }
      setEmailError("");
    }

    const payload = {
      name: updatedUser.name,
      email: updatedUser.email === selectedUser.email ? undefined : updatedUser.email,
      password: updatedUser.password || undefined,
      type: updatedUser.type,
    };

    try {
      await axios.put(`http://localhost:5000/api/users/${selectedUser._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemporaryMessage("Usuario actualizado correctamente");
      setSelectedUser(null);
      setShowModal(false);
      fetchUsers();
    } catch {
      setTemporaryError("Error al actualizar el usuario");
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemporaryMessage("Usuario eliminado exitosamente");
      fetchUsers();
    } catch {
      setTemporaryError("Error al eliminar el usuario");
    }
  };

  const deactivateUser = async (userId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${userId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemporaryMessage("Usuario desactivado correctamente");
      fetchUsers();
    } catch {
      setTemporaryError("Error al desactivar el usuario");
    }
  };

  const activateUser = async (userId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${userId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemporaryMessage("Usuario activado correctamente");
      fetchUsers();
    } catch {
      setTemporaryError("Error al activar el usuario");
    }
  };

  const setTemporaryMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };
  const setTemporaryError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setPasswordError("");
    setEmailError("");
  };

  const getInitials = (name = "") => name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const getUserTypeIcon = (type) =>
    type === "admin" ? <BsShield size={16} className="um-icon-white" /> : <BsPerson size={16} className="um-icon-info" />;
  const getUserTypeBadge = (type) =>
    type === "admin" ? "bg-warning bg-opacity-20 text-white" : "bg-info bg-opacity-20 text-info";

  // shared card styles
  const cardStyle = {
    border: "none",
    borderRadius: "18px",
    boxShadow: "0 8px 28px rgba(16,24,40,0.10)",
    transition: "transform .25s ease, box-shadow .25s ease",
    background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
    position: "relative",
    overflow: "hidden",
  };
  const cardHoverStyle = { transform: "translateY(-6px)", boxShadow: "0 16px 44px rgba(16,24,40,0.16)" };
  const primaryButtonStyle = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    padding: "12px 24px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
  };
  const backgroundPattern = {
    position: "absolute",
    inset: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)
    `,
    pointerEvents: "none",
    zIndex: 1,
  };

  const renderGridView = () => (
    <Row className="g-4 um-grid">
      {filteredUsers.map((u) => (
        <Col key={u._id} xs={12} sm={6} md={6} lg={4} xl={3} xxl={3}>
          <Card
            style={{ ...cardStyle, minHeight: 260, cursor: "pointer" }}
            className="user-card-hover"
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.10)";
            }}
          >
            <div style={backgroundPattern}></div>
            <Card.Body className="d-flex flex-column justify-content-between p-4 position-relative" style={{ zIndex: 2 }}>
              <div className="text-center mb-4">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold mb-3"
                  style={{
                    width: 70,
                    height: 70,
                    background:
                      u.type === "admin"
                        ? "linear-gradient(135deg, #ff9a56 0%, #ffad56 100%)"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    fontSize: "1.4rem",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                    border: "2px solid rgba(255,255,255,0.9)",
                  }}
                >
                  {getInitials(u.name)}
                </div>
                <h5 className="fw-bold mb-2 um-text-title" style={{ fontSize: "1.1rem" }}>
                  {u.name}
                </h5>
                <p className="um-text-subtle small mb-3" style={{ fontSize: "0.9rem", wordBreak: "break-word" }}>
                  {u.email}
                </p>

                <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                  <span
                    className={`badge ${getUserTypeBadge(u.type)} px-3 py-2 text-white`}
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      border: u.type === "admin" ? "1px solid rgba(255,193,7,.3)" : "1px solid rgba(13,202,240,.3)",
                    }}
                  >
                    {getUserTypeIcon(u.type)} {u.type === "admin" ? "Admin" : "Usuario"}
                  </span>
                  <span
                    className={`badge ${
                      u.status === "active" ? "bg-success bg-opacity-20 text-white" : "bg-danger bg-opacity-20 text-white"
                    } px-3 py-2`}
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      border: u.status === "active" ? "1px solid rgba(40,167,69,.3)" : "1px solid rgba(220,53,69,.3)",
                    }}
                  >
                    {u.status === "active" ? "● Activo" : "○ Inactivo"}
                  </span>
                </div>
              </div>

              <div className="d-grid gap-2">
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateSelect(u)}
                    style={{
                      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 600,
                      padding: "8px 12px",
                      fontSize: ".85rem",
                    }}
                    className="flex-grow-1"
                    title="Editar usuario"
                    aria-label={`Editar ${u.name}`}
                  >
                    <BsPencil size={14} className="me-1" />
                    Editar
                  </Button>

                  {u.status === "active" ? (
                    <Button
                      size="sm"
                      onClick={() => deactivateUser(u._id)}
                      style={{
                        background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: 600,
                        padding: "8px 12px",
                        color: "#8b4513",
                      }}
                      title="Desactivar usuario"
                      aria-label={`Desactivar ${u.name}`}
                    >
                      <BsPersonX size={14} />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => activateUser(u._id)}
                      style={{
                        background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: 600,
                        padding: "8px 12px",
                        color: "#2d5016",
                      }}
                      title="Activar usuario"
                      aria-label={`Activar ${u.name}`}
                    >
                      <BsPersonCheck size={14} />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => deleteUser(u._id)}
                    style={{
                      background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 600,
                      padding: "8px 12px",
                      color: "#8b0000",
                    }}
                    title="Eliminar usuario"
                    aria-label={`Eliminar ${u.name}`}
                  >
                    <BsTrash size={14} />
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderListView = () => (
    <div className="um-list">
      {filteredUsers.map((u) => (
        <div key={u._id} className="um-list-row p-4 rounded-4">
          <div className="um-list-main">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold um-avatar"
              style={{
                background:
                  u.type === "admin"
                    ? "linear-gradient(135deg, #ff9a56 0%, #ffad56 100%)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "2px solid rgba(255,255,255,0.9)",
              }}
            >
              {getInitials(u.name)}
            </div>

            <div className="um-list-text">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h6 className="fw-bold mb-0 um-text-title um-name">{u.name}</h6>
                <span className={`badge ${getUserTypeBadge(u.type)} px-3 py-1 um-badge text-white`}>
                  {getUserTypeIcon(u.type)} {u.type === "admin" ? "Admin" : "Usuario"}
                </span>
              </div>

              <p className="um-text-subtle small mb-2 um-email">{u.email}</p>

              <span
                className={`badge ${
                  u.status === "active" ? "bg-success bg-opacity-20 text-white" : "bg-danger bg-opacity-20 text-white"
                } px-3 py-1 um-status`}
              >
                {u.status === "active" ? "● Activo" : "○ Inactivo"}
              </span>
            </div>
          </div>

          <div className="um-actions">
            <Button
              size="sm"
              onClick={() => handleUpdateSelect(u)}
              className="um-action"
              title="Editar usuario"
              aria-label={`Editar ${u.name}`}
              style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", border: "none" }}
            >
              <BsPencil size={14} />
            </Button>

            {u.status === "active" ? (
              <Button
                size="sm"
                onClick={() => deactivateUser(u._id)}
                className="um-action"
                title="Desactivar usuario"
                aria-label={`Desactivar ${u.name}`}
                style={{ background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", border: "none", color: "#8b4513" }}
              >
                <BsPersonX size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => activateUser(u._id)}
                className="um-action"
                title="Activar usuario"
                aria-label={`Activar ${u.name}`}
                style={{ background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", border: "none", color: "#2d5016" }}
              >
                <BsPersonCheck size={14} />
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => deleteUser(u._id)}
              className="um-action"
              title="Eliminar usuario"
              aria-label={`Eliminar ${u.name}`}
              style={{ background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", border: "none", color: "#8b0000" }}
            >
              <BsTrash size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <LayoutWithSidebar>
      <div className="d-flex flex-column min-vh-100 um-page">
        {/* remove inner scroll; let the page scroll naturally */}
        <div className="flex-grow-1 d-flex flex-column" style={{ padding: "0 24px 24px", overflow: "visible" }}>
          {/* Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center py-4 gap-3">
            <div>
              <h1 className="fw-bold mb-1 um-title">Gestión de Usuarios</h1>
              <p className="mb-0 um-text-subtle" style={{ fontSize: "1.05rem" }}>
                Administra los usuarios del sistema y sus permisos
              </p>
            </div>
            <button
              className="bg-white rounded-circle p-3 shadow-sm border-0 um-contrast-surface"
              style={{ cursor: "pointer" }}
              aria-label="Opciones"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,24,40,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(16,24,40,0.08)";
              }}
            >
              <BsPersonGear size={20} className="um-icon-primary" />
            </button>
          </div>

          {/* Alerts */}
          <Container fluid className="px-0">
            {message && (
              <Alert variant="success" className="d-flex align-items-center mb-4 um-alert-success">
                <BsPersonCheck size={20} className="me-2" />
                {message}
              </Alert>
            )}
            {error && (
              <Alert variant="danger" className="d-flex align-items-center mb-4 um-alert-danger">
                <BsPersonX size={20} className="me-2" />
                {error}
              </Alert>
            )}

            {/* Main Grid */}
            <Row className="g-4 mb-4">
              {/* Create User */}
              <Col xs={12} lg={4}>
                <Card
                  style={cardStyle}
                  className="h-100"
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.10)";
                  }}
                >
                  <div style={backgroundPattern}></div>
                  <Card.Body className="p-4 position-relative" style={{ zIndex: 2 }}>
                    <div className="d-flex align-items-center mb-4">
                      <div className="bg-white bg-opacity-15 rounded-circle p-3 me-3 um-chip-border">
                        <BsPersonPlus size={24} className="um-icon-primary" />
                      </div>
                      <div>
                        <h4 className="fw-bold mb-1 um-text-title">Crear Nuevo Usuario</h4>
                        <p className="um-text-subtle small mb-0">Añadir un usuario al sistema</p>
                      </div>
                    </div>

                    <Form onSubmit={createUser}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold um-text-title">Nombre completo</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Ingrese el nombre completo"
                          value={newUser.name}
                          onChange={(e) => handleInputChange(e, setNewUser)}
                          required
                          className="um-input"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold um-text-title">Correo electrónico</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="usuario@ejemplo.com"
                          value={newUser.email}
                          onChange={(e) => handleInputChange(e, setNewUser)}
                          required
                          className="um-input"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold um-text-title">Contraseña</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          placeholder="Mínimo 8 caracteres"
                          value={newUser.password}
                          onChange={(e) => handleInputChange(e, setNewUser)}
                          required
                          className="um-input"
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold um-text-title">Tipo de usuario</Form.Label>
                        <Form.Select
                          name="type"
                          value={newUser.type}
                          onChange={(e) => handleInputChange(e, setNewUser)}
                          className="um-input"
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Administrador</option>
                        </Form.Select>
                      </Form.Group>

                      {passwordError && (
                        <Alert variant="danger" className="py-2 px-3 small mb-3 um-soft-alert">
                          {passwordError}
                        </Alert>
                      )}

                      <Button type="submit" className="w-100 d-flex align-items-center justify-content-center" style={primaryButtonStyle}>
                        <BsPersonPlus size={18} className="me-2" />
                        Crear Usuario
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              {/* Users List */}
              <Col xs={12} lg={8}>
                <Card
                  style={cardStyle}
                  className="h-100"
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.10)";
                  }}
                >
                  <div style={backgroundPattern}></div>
                  <Card.Body className="p-4 position-relative" style={{ zIndex: 2 }}>
                    {/* Header w/ search + toggle */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-white bg-opacity-15 rounded-circle p-3 me-3 um-chip-border--success">
                          <BsPeople size={24} className="um-icon-success" />
                        </div>
                        <div>
                          <h4 className="fw-bold mb-1 um-text-title">Lista de Usuarios</h4>
                          <p className="um-text-subtle small mb-0">
                            {filteredUsers.length} de {users.length} usuarios
                          </p>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3 flex-wrap um-tools">
                        {/* Search */}
                        <InputGroup className="um-search">
                          <InputGroup.Text className="um-search__addon">
                            <BsSearch size={16} className="um-icon-muted" />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="um-search__input"
                            aria-label="Buscar usuarios"
                          />
                        </InputGroup>

                        {/* View Toggle */}
                        <div className="bg-light rounded-4 p-1 um-toggle">
                          <Button
                            variant={viewMode === "grid" ? "primary" : "light"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            aria-pressed={viewMode === "grid"}
                            aria-label="Vista de tarjetas"
                            className="um-toggle__btn"
                          >
                            <BsGrid size={16} />
                          </Button>
                          <Button
                            variant={viewMode === "list" ? "primary" : "light"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            aria-pressed={viewMode === "list"}
                            aria-label="Vista de lista"
                            className="um-toggle__btn"
                          >
                            <BsList size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Display (no inner scroll; content flows) */}
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-5">
                        <div
                          className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4 um-chip-border"
                          style={{ width: 80, height: 80 }}
                        >
                          <BsPeople size={32} className="um-icon-muted" />
                        </div>
                        <h5 className="fw-semibold mb-3 um-text-title">
                          {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                        </h5>
                        <p className="um-text-subtle mb-4" style={{ fontSize: "1.05rem" }}>
                          {searchTerm ? "Intenta con otros términos de búsqueda" : "Crea el primer usuario usando el formulario"}
                        </p>
                        {searchTerm && (
                          <Button variant="outline-primary" onClick={() => setSearchTerm("")} className="um-btn-outline">
                            Limpiar búsqueda
                          </Button>
                        )}
                      </div>
                    ) : viewMode === "grid" ? (
                      renderGridView()
                    ) : (
                      renderListView()
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>

          {/* Edit Modal */}
          <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static" size="md">
            <Modal.Header
              closeButton
              className="border-0 pb-0"
              style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)", borderRadius: "20px 20px 0 0" }}
            >
              <Modal.Title className="d-flex align-items-center fw-bold um-text-title" style={{ fontSize: "1.5rem" }}>
                <BsPencil size={24} className="me-3 um-icon-primary" />
                Editar Usuario
              </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)", padding: "2rem" }}>
              <Form onSubmit={updateUser}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold um-text-title mb-2">Nombre completo</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Nombre completo"
                    value={updatedUser.name || selectedUser?.name || ""}
                    onChange={(e) => handleInputChange(e, setUpdatedUser)}
                    className="um-input"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold um-text-title mb-2">Correo electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    value={updatedUser.email || selectedUser?.email || ""}
                    onChange={(e) => handleInputChange(e, setUpdatedUser)}
                    className="um-input"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold um-text-title mb-2">Tipo de usuario</Form.Label>
                  <Form.Select
                    name="type"
                    value={updatedUser.type || selectedUser?.type || "user"}
                    onChange={(e) => handleInputChange(e, setUpdatedUser)}
                    className="um-input"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold um-text-title mb-2">Nueva contraseña (opcional)</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Dejar vacío para mantener actual"
                    value={updatedUser.password || ""}
                    onChange={(e) => handleInputChange(e, setUpdatedUser)}
                    className="um-input"
                  />
                </Form.Group>

                {passwordError && (
                  <Alert variant="danger" className="py-3 px-4 mb-4 um-soft-alert">
                    {passwordError}
                  </Alert>
                )}
                {emailError && (
                  <Alert variant="danger" className="py-3 px-4 mb-4 um-soft-alert">
                    {emailError}
                  </Alert>
                )}

                <div className="d-flex gap-3 justify-content-end flex-wrap">
                  <Button variant="outline-secondary" onClick={handleCloseModal} className="um-btn-outline">
                    Cancelar
                  </Button>
                  <Button type="submit" className="d-flex align-items-center" style={primaryButtonStyle}>
                    <BsPersonCheck size={18} className="me-2" />
                    Actualizar Usuario
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </div>

        <Footer />
      </div>
    </LayoutWithSidebar>
  );
};

export default UserManagement;
