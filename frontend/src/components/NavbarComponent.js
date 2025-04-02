import React from "react";
import { Navbar, Container } from "react-bootstrap";
import { BsBoxArrowRight } from "react-icons/bs";
import Logo from "../resources/CLAIRITYWHITEMONO.png";
import { useNavigate } from "react-router-dom";

const NavbarComponent = ({ handleLogout }) => {
  const navigate = useNavigate();

  // Lógica para cerrar sesión
  const handleLogoutClick = async () => {
    try {
      // Puedes hacer una solicitud al backend para cambiar el estado de la sesión a 'inactive'
      await fetch("${process.env.REACT_APP_BACKEND_API_URL}/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Aquí podrías enviar el token o la información necesaria si es necesario
        body: JSON.stringify({ token: localStorage.getItem("token") }),
      });

      // Borra el token del localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirige al usuario a la página de login
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <Navbar
      className="text-white p-3 shadow-sm w-100"
      style={{
        backgroundColor: "#40C8FF",
        position: "fixed", // 🔥 Navbar fija en la parte superior
        top: 0,
        left: 0,
        width: "100vw", // Se extiende por todo el ancho
        zIndex: 1000, // Asegura que esté por encima de otros elementos
      }}
    >
      <Container fluid className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <img 
            src={Logo} 
            alt="Clairity" 
            style={{ height: 40, width: "auto", marginRight: 15, cursor: "pointer" }} 
            onClick={() => navigate("/dashboard")} 
          />
        </div>
        <div className="d-flex align-items-center">
          <span 
            className="fw-bold text-white me-3" 
            onClick={() => navigate("/dashboard")} 
            style={{ cursor: "pointer" }}
          >
            Inicio
          </span>
          <span 
            className="fw-bold text-white me-3" 
            onClick={() => navigate("/profile")}  // Redirige a la página de perfil
            style={{ cursor: "pointer" }}
          >
            Perfil
          </span>
          <span 
            className="fw-bold text-white me-3" 
            onClick={handleLogoutClick}  // Cerrar sesión
            style={{ cursor: "pointer" }}
          >
            Cerrar Sesión
          </span>
          <BsBoxArrowRight size={20} className="text-white" onClick={handleLogoutClick} style={{ cursor: "pointer" }} />
        </div>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
