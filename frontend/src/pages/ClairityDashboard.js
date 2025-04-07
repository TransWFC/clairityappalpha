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
  const [userId, setUserId] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [name, setName] = useState("");
  const [coordinates, setCoordinates] = useState("20.5888, -100.3899");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token) {
      navigate("/login");
    } else {
      if (user) setUserType(user.type);
      setUserId(user._id);
      setAlertsEnabled(user.alerts);
      setName(user.name);
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

  const toggleAlerts = async () => {
    try {
      const newValue = !alertsEnabled;
      const res = await fetch(`/api/users/${userId}/toggle-alerts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ alertsEnabled: newValue }), // Send with alertsEnabled property
      });
      
      const data = await res.json(); // Get the response data
      
      if (res.ok) {
        setAlertsEnabled(newValue); // Update the state immediately
        
        // Update user in localStorage with correct property name
        const user = JSON.parse(localStorage.getItem("user"));
        user.alerts = newValue; // Make sure we're using the same property name as backend
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        console.error("Error al actualizar las alertas:", data.message);
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };

  const handleCoordinatesChange = (e) => {
    setCoordinates(e.target.value);
  };

  const parseCoordinates = (coordinates) => {
    const [lat, lng] = coordinates.split(",").map(coord => parseFloat(coord.trim()));
    return { lat, lng };
  };

  return (
    <div className="d-flex flex-column" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px" }}>
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}

      <div
        className="flex-grow-1 d-flex flex-column"
        style={{ overflow: "auto", marginLeft: userType === "admin" ? "250px" : "0" }}
      >
        {/* Añadir un top o margen superior aquí */}
        <div style={{ marginTop: "20px" }}></div>

        <NavbarComponent handleLogout={handleLogout} />

        <div className="d-flex justify-content-end gap-3 p-3 flex-wrap">
          <BsBell
            size={20}
            className={alertsEnabled ? "text-primary" : "text-secondary"}
            style={{ cursor: "pointer" }}
            onClick={toggleAlerts}
          />
          <BsFlag size={20} className="text-dark" />
        </div>

        <div className="d-flex justify-content-center align-items-center text-center px-3">
          <h1 className="fw-bold" style={{ fontSize: "2.5rem", color: "#333" }}>
            Bienvenido, {name} {userType === "admin" && "(Administrador)"}
          </h1>
        </div>

        <Container className="mt-3 px-3">
          <Row className="gx-3 gy-3">
            <Col xs={12} md={6}>
              <Card className="text-center shadow-lg border-0 rounded-4">
                <div
                  className="p-4 d-flex flex-column align-items-start w-100 position-relative"
                  style={{
                    minHeight: "250px",
                    backgroundColor: (() => {
                      const aqi = sensorData ? sensorData.AQI : 0;
                      if (aqi <= 50) return "#00E400";
                      if (aqi <= 100) return "#FFFF00";
                      if (aqi <= 150) return "#FF7E00";
                      return "#800080";
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
                <div className="p-3 d-flex flex-column align-items-center bg-white rounded-bottom-4">
                  <div className="d-flex flex-column align-items-center justify-content-center w-100">
                    <BsSun size={24} className="text-dark me-2" />
                    <span className="fw-bold text-dark">{sensorData ? `${sensorData.temperature}°` : "--"}</span>
                  </div>
                  <p className="fw-bold text-dark my-1">Santiago de Querétaro, Qro.</p>
                  <h3 className="fw-bold text-dark">{currentTime}</h3>
                  <Button
                    variant="primary"
                    className="rounded-circle mt-2 d-flex justify-content-center align-items-center"
                    style={{ width: "40px", height: "40px", backgroundColor: "#40C8FF", borderColor: "#40C8FF", padding: 0 }}
                    onClick={() => navigate("/detail")}
                  >
                    <BsPlus size={24} color="#000" />
                  </Button>
                </div>
              </Card>
            </Col>

            <Col xs={12} md={6}>
              <p className="fw-bold mb-2 text-dark" style={{ fontSize: "1.2rem" }}>
                Última actualización {sensorData ? moment(sensorData.timestamp).fromNow() : "Cargando..."}
              </p>
              <div className="bg-white p-3 rounded-4 shadow-sm">
                <SensorMap coordinates={coordinates} />
              </div>
            </Col>
          </Row>

          <Row className="mt-4 align-items-center p-3 shadow-sm rounded-4 bg-light gx-3 gy-3">
            <Col xs={12} md={2} className="d-flex flex-column align-items-center justify-content-center p-3 bg-white rounded-4 border">
              <p className="text-muted mb-1 fw-bold">Dispositivo Actual:</p>
              <h5 className="mb-0 fw-bold">{sensorData ? sensorData.device_id : "Cargando..."}</h5>
            </Col>

            <Col xs={12} md={10} className="p-3 bg-white rounded-4 border">
              <h5 className="text-center fw-bold">Predicción con IA</h5>
              <div className="d-flex justify-content-center mt-2 flex-wrap gap-3">
                <Button
                  variant="primary"
                  className="rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: "40px", height: "40px", backgroundColor: "#40C8FF", borderColor: "#40C8FF", padding: 0 }}
                  onClick={() => navigate("/ai")}
                >
                  <BsPlus size={24} color="#000" />
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default ClarityDashboard;
