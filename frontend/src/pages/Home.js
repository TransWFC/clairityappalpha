import React from "react";
import { useNavigate } from "react-router-dom";
import "../Estilos/Home.css";
import logo from "../resources/CLAIRITYWHITEMONO.png";
import home from "../resources/home_back_image.png";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page-container">
      <div className="home-page-content">
        <img src={logo} alt="Clairity Logo" className="home-page-logo" />
        <p className="home-page-tagline">
          "En Clairity, transformamos datos en decisiones inteligentes para un aire más limpio y saludable."
        </p>
        <div className="home-page-buttons">
          <button className="home-page-btn" onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
          <button className="home-page-btn" onClick={() => navigate("/signup")}>
            Crear cuenta
          </button>
          <button className="home-page-btn" onClick={() => navigate("/visitor")}>
            Ingresar como visitante
          </button>
          <button className="home-page-btn" onClick={() => navigate("/about")}>
            About
          </button>
        </div>
      </div>
      <div className="home-page-image-container">
        <img src={home} alt="Ilustración fondo" className="home-page-image" />
      </div>
    </div>
  );
}

export default Home;
