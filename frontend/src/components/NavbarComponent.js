import React from "react";
import { Navbar, Container, Dropdown } from "react-bootstrap";
import {
  BsBoxArrowRight, BsPerson, BsShield, BsList, BsHouseDoor, BsPersonGear
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import Logo from "../resources/CLAIRITYBLACKMONO.png";

const NavbarComponent = ({ handleLogout, toggleSidebar }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.type === "admin";

  const handleLogoutClick = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: localStorage.getItem("token") }),
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const getInitials = (name) => (!name ? "U" : name.split(" ").map(n => n[0]).join("").toUpperCase());
  const getUserTypeInfo = () =>
    isAdmin
      ? { icon: BsShield, color: "#ff9a56", label: "Admin" }
      : { icon: BsPerson, color: "#667eea", label: "User" };

  const typeInfo = getUserTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <Navbar
      className="shadow-sm"
      style={{
        backgroundColor: "white",
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 1030,
        borderBottom: "1px solid #e9ecef",
        backdropFilter: "blur(10px)",
        height: "70px"
      }}
    >
      <Container fluid className="d-flex justify-content-between align-items-center px-3 px-md-4">
        {/* Left */}
        <div className="d-flex align-items-center">
          {isAdmin && (
            <button
              type="button"
              aria-label="Abrir menú lateral"
              className="d-flex align-items-center justify-content-center me-3 rounded-circle border-0"
              style={{
                width: 40, height: 40,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                cursor: "pointer", transition: "all 0.3s ease"
              }}
              onClick={toggleSidebar}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <BsList size={20} className="text-white" />
            </button>
          )}

          <img
            src={Logo}
            alt="Clairity"
            style={{ height: 40, width: "auto", cursor: "pointer", transition: "all 0.3s ease" }}
            onClick={() => navigate("/dashboard")}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        </div>

        {/* Center links (hide on < lg; they’re still in the profile menu) */}
        <div className="d-none d-lg-flex align-items-center gap-3 gap-xl-4">
          <div
            className="d-flex align-items-center px-3 py-2 rounded-pill"
            role="button"
            onClick={() => navigate("/dashboard")}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(102,126,234,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <BsHouseDoor size={16} className="me-2" style={{ color: "#667eea" }} />
            <span className="fw-semibold" style={{ color: "#1a1d29", fontSize: "0.95rem" }}>
              Dashboard
            </span>
          </div>

          <div
            className="d-flex align-items-center px-3 py-2 rounded-pill"
            role="button"
            onClick={() => navigate("/profile")}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(102,126,234,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <BsPersonGear size={16} className="me-2" style={{ color: "#667eea" }} />
            <span className="fw-semibold" style={{ color: "#1a1d29", fontSize: "0.95rem" }}>
              Perfil
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <Dropdown align="end">
            <Dropdown.Toggle as="div" className="d-flex align-items-center" style={{ cursor: "pointer" }}>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white fw-bold"
                  style={{
                    width: 40, height: 40,
                    background: `linear-gradient(135deg, ${typeInfo.color} 0%, ${typeInfo.color}aa 100%)`,
                    fontSize: "0.875rem", transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  aria-label="Menú de usuario"
                >
                  {getInitials(user?.name)}
                </div>

                {/* Hide name on small; show from md up */}
                <div className="d-none d-md-block">
                  <div className="fw-semibold" style={{ color: "#1a1d29", fontSize: "0.9rem" }}>
                    {user?.name || "Usuario"}
                  </div>
                  <div className="d-flex align-items-center">
                    <TypeIcon size={12} className="me-1" style={{ color: typeInfo.color }} />
                    <small style={{ color: typeInfo.color, fontWeight: 600 }}>{typeInfo.label}</small>
                  </div>
                </div>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu
              className="mt-2 border-0 shadow-lg"
              style={{ width: 240, borderRadius: 12, background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)" }}
            >
              <div className="p-3 border-bottom text-center">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold mb-2"
                  style={{
                    width: 50, height: 50,
                    background: `linear-gradient(135deg, ${typeInfo.color} 0%, ${typeInfo.color}aa 100%)`,
                    fontSize: "1.1rem"
                  }}
                >
                  {getInitials(user?.name)}
                </div>
                <h6 className="fw-bold mb-1" style={{ color: "#1a1d29" }}>
                  {user?.name || "Usuario"}
                </h6>
                <div className="d-flex align-items-center justify-content-center">
                  <TypeIcon size={14} className="me-1" style={{ color: typeInfo.color }} />
                  <small style={{ color: typeInfo.color, fontWeight: 600 }}>{typeInfo.label}</small>
                </div>
              </div>

              {/* Keep quick links here so mobile users can reach them */}
              <Dropdown.Item onClick={() => navigate("/dashboard")} className="d-flex align-items-center p-3">
                <BsHouseDoor size={16} className="me-3 text-success" />
                <span className="fw-medium">Dashboard</span>
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/profile")} className="d-flex align-items-center p-3">
                <BsPersonGear size={16} className="me-3 text-primary" />
                <span className="fw-medium">Mi Perfil</span>
              </Dropdown.Item>

              <Dropdown.Divider />

              <Dropdown.Item onClick={handleLogoutClick} className="d-flex align-items-center p-3 text-danger">
                <BsBoxArrowRight size={16} className="me-3" />
                <span className="fw-medium">Cerrar Sesión</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
