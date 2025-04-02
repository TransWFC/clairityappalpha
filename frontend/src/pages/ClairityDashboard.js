import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Container, Row, Col, Button } from "react-bootstrap";
import { BsCloud, BsSun, BsBell, BsFlag, BsPlus } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import NavbarComponent from "../components/NavbarComponent";
import SidebarComponent from "../components/SidebarComponent";
import SensorMap from "../components/GoogleMap";
import "../Estilos/ClairityDashboard.css";

const ClarityDashboard = () => {
  const navigate = useNavigate();
  const [sensorData, setSensorData] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment().tz("America/Mexico_City").format("HH:mm"));
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token) {
      navigate("/login");
    } else {
      if (user) setUserType(user.type);
      setIsAuthenticated(true);
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment().tz("America/Mexico_City").format("HH:mm"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const sensorRes = await fetch("/api/sensors/get");
          const sensorData = await sensorRes.json();
          if (sensorData.length > 0) setSensorData(sensorData[0]);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="d-flex vh-100" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px", overflow: "hidden" }}>
      {/* Sidebar solo para admin */}
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}

      {/* Contenido principal */}
      <div
        className="flex-grow-1 d-flex flex-column h-100"
        style={{
          overflow: "hidden",
          marginLeft: userType === "admin" ? "250px" : "0", // Ajusta el margen izquierdo si el usuario es admin
        }}
      >
        {/* Navbar fija */}
        <NavbarComponent handleLogout={handleLogout} />

        {/* Iconos fuera del Navbar */}
        <div className="d-flex justify-content-end gap-3 p-3">
          <BsBell size={20} className="text-dark" style={{ cursor: "pointer" }} />
          <BsFlag size={20} className="text-dark" />
        </div>

        {/* Dashboard */}
        <Container className="mt-3 flex-grow-1 h-100 px-0">
          <Row noGutters>
            {/* Calidad del aire */}
            <Col md={6} className="mb-3">
              <Card className="text-center shadow-lg rounded-4 border-0" style={{ border: "2px solid #ddd", borderRadius: "30px" }}>
                <div
                  className="p-4 d-flex flex-column align-items-start shadow-lg w-100 position-relative"
                  style={{
                    minHeight: "250px",
                    backgroundColor: (() => {
                      const aqi = sensorData ? sensorData.AQI : 0;
                      if (aqi <= 50) return "#00E400"; // Verde
                      if (aqi <= 100) return "#FFFF00"; // Amarillo
                      if (aqi <= 150) return "#FF7E00"; // Naranja
                      return "#800080"; // Púrpura
                    })(),
                    borderRadius: "20px",
                    border: "2px solid #ddd",
                  }}
                >
                  <p className="fw-bold mb-1 text-white" style={{ fontSize: "1.2rem" }}>Calidad actual:</p>
                  <h4 className="mb-2 text-dark fw-bold">{sensorData ? sensorData.AQI : "Cargando..."}</h4>
                  <BsCloud size={130} className="text-white position-absolute" style={{ top: "10px", right: "20px" }} />
                  <h2 className="fw-bold text-dark position-absolute" style={{ fontSize: "3rem", top: "150px", right: "30px" }}>
                    {sensorData ? sensorData.AQI : "--"}
                  </h2>
                </div>
                <div className="p-3 d-flex flex-column align-items-center bg-white" style={{  borderRadius: "5px" }}>
                  <div className="d-flex flex-column align-items-center justify-content-center w-100">
                    <BsSun size={24} className="text-dark me-2" />
                    <span className="fw-bold text-dark">{sensorData ? `${sensorData.temperature}°` : "--"}</span>
                  </div>
                  <p className="fw-bold text-dark my-1">Santiago de Querétaro, Qro.</p>
                  <h3 className="fw-bold text-dark">{currentTime}</h3>
                  <Button
                    variant="primary"
                    className="rounded-circle mt-2 d-flex justify-content-center align-items-center"
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#40C8FF",
                      borderColor: "#40C8FF",
                      padding: 0,
                    }}
                    onClick={() => navigate("/detail")}
                  >
                    <BsPlus size={24} color="#000" />
                  </Button>
                </div>
              </Card>
            </Col>

            {/* Mapa y última actualización */}
            <Col md={6} className="mb-3">
              <p className="fw-bold mb-0 text-dark" style={{ fontSize: "1.2rem" }}>
                Última actualización {sensorData ? moment(sensorData.timestamp).fromNow() : "Cargando..."}
              </p>
              <div className="bg-light p-3 rounded-4 shadow-lg" style={{ border: "2px solid #ddd", borderRadius: "10px" }}>
                {sensorData && sensorData.location ? (
                  <SensorMap key={sensorData.device_id} coordinates={sensorData?.location} />
                ) : (
                  <p>Cargando mapa...</p>
                )}
              </div>
            </Col>
          </Row>

          {/* Nueva fila agregada para el ID del dispositivo y la Predicción con IA */}
          <Row className="mt-4 align-items-center p-3 shadow-sm rounded-4 bg-light" style={{ border: "2px solid #ddd", borderRadius: "5px" }}>
            {/* ID del dispositivo */}
            <Col md={2} className="d-flex flex-column align-items-center justify-content-center p-3 bg-white rounded-4" style={{ border: "2px solid #ddd", borderRadius: "10px" }}>
              <p className="text-muted mb-1 fw-bold">Dispositivo Actual:</p>
              <h5 className="mb-0 fw-bold">{sensorData ? sensorData.device_id : "Cargando..."}</h5>
            </Col>

            {/* Predicción con IA */}
            <Col md={10} className="p-3 bg-white rounded-4" style={{ border: "2px solid #ddd", borderRadius: "10px" }}>
              <h5 className="text-center fw-bold">Predicción con IA</h5>
              <div className="d-flex justify-content-around mt-2">
                {["18:00", "19:00", "20:00", "21:00"].map((hour, index) => {
                  const colors = ["#7CFC00", "#FFD700", "#9370DB", "#FF4500"];
                  return (
                    <div key={index} className="text-center">
                      <p className="mb-1 fw-bold">{hour}</p>
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: "40px", height: "40px", backgroundColor: colors[index], color: "#000" }}>
                        100
                      </div>
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default ClarityDashboard;
