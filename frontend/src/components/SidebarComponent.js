import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../Estilos/Sidebar.css"; // Asegúrate de que el archivo CSS esté correctamente importado

const SidebarComponent = ({ handleLogout }) => {
  const navigate = useNavigate();

  return (
    <div
      className="sidebar text-white p-3 d-flex flex-column flex-shrink-0"
      style={{
        width: "250px",
        backgroundColor: "#40C8FF",
        height: "calc(100vh - 56px)", // Ajusta la altura para evitar superposiciones
        position: "fixed",
        top: "65px", // Baja el sidebar para que no quede debajo de la navbar
        left: 0,
        overflowY: "auto",
        zIndex: 1000, // Asegura que la sidebar siempre quede arriba en el z-index
      }}
    >
      <br></br><br></br>
      <Button
        className="my-2 text-start btn-custom-sidebar"
        onClick={() => navigate("/devices")}
      >
        Gestión de dispositivos IOT
      </Button>
      <Button
        className="my-2 text-start btn-custom-sidebar"
        onClick={() => navigate("/users")}
      >
        Gestión de Usuarios
      </Button>
      <Button
        className="my-2 text-start btn-custom-sidebar"
        onClick={() => navigate("/dashboard")}
      >
        Visualización de Métricas
      </Button>
      <Button className="my-2 text-start btn-custom-sidebar">
        Predicciones y Modelos de IA
      </Button>
      <Button className="my-2 text-start btn-custom-sidebar">
        Alertas y Notificaciones
      </Button>
      <Button
        className="mt-auto text-start fw-bold p-2 shadow-lg rounded-3 btn-danger-custom"
        onClick={handleLogout}
      >
        Salir
      </Button>
    </div>
  );
};

export default SidebarComponent;
