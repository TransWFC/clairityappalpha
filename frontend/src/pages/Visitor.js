import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Navbar, Container, Row, Col, Button } from "react-bootstrap";
import { BsCloud, BsSun, BsBoxArrowRight, BsBell, BsFlag, BsPlus } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import SensorMap from "../components/GoogleMap";
import moment from "moment-timezone";

const Visitor = () => {
  const navigate = useNavigate();
  const [sensorData, setSensorData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [currentTime, setCurrentTime] = useState(moment().tz("America/Mexico_City").format("HH:mm"));

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(moment().tz("America/Mexico_City").format("HH:mm"));
    };
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch("/api/sensors/history");
        const data = await response.json();
        setHistoricalData(data);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };
    fetchHistoricalData();

    const fetchSensorData = async () => {
      try {
        const response = await fetch("/api/sensors/get");
        const data = await response.json();
        if (data.length > 0) {
          setSensorData(data[0]);
        }
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };
    fetchSensorData();
  }, []);

  return (
    <div className="d-flex flex-column vh-100" style={{ fontFamily: "Raleway, sans-serif" }}>
      <Navbar className="text-white p-3 shadow-sm w-100" style={{ backgroundColor: "#40C8FF" }}>
        <Container fluid className="d-flex justify-content-end align-items-center">
          <span className="fw-bold text-white me-3">Perfil</span>
          <span className="fw-bold text-white me-3">Cerrar Sesión</span>
          <BsBoxArrowRight size={20} className="text-white" />
        </Container>
      </Navbar>

      <div className="d-flex justify-content-end gap-3 p-3">
        <BsBell size={20} className="text-dark" style={{ cursor: "pointer" }} />
        <BsFlag size={20} className="text-dark" />
      </div>

      <Container className="mt-3 flex-grow-1 h-100">
        <Row>
          <Col md={6} className="mb-3">
            <Card className="text-center shadow-lg rounded-4 overflow-hidden border-0">
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
                  })()
                }}
              >
                <p className="fw-bold mb-1 text-white" style={{ fontSize: "1.2rem" }}>Calidad actual:</p>
                <h4 className="mb-2 text-dark" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {sensorData ? sensorData.AQI : "Cargando..."}
                </h4>
                <BsCloud size={130} className="text-white position-absolute" style={{ top: "10px", right: "20px" }} />
                <p className="fw-semibold text-white position-absolute" style={{ fontSize: "1.2rem", top: "120px", right: "30px" }}>US AQI</p>
                <h2 className="fw-bold text-dark position-absolute" style={{ fontSize: "3rem", top: "150px", right: "30px" }}>
                  {sensorData ? sensorData.AQI : "--"}
                </h2>
              </div>
              <div className="p-3 d-flex flex-column align-items-center" style={{ backgroundColor: "white" }}>
                <div className="d-flex align-items-center">
                  <BsSun size={24} className="text-dark me-2" />
                  <span className="fw-bold text-dark" style={{ fontSize: "1.2rem" }}>
                    {sensorData ? ${sensorData.temperature}° : "--"}
                  </span>
                </div>
                <p className="fw-bold text-dark my-1">Santiago de Querétaro, Qro.</p>
                <h3 className="fw-bold text-dark">{currentTime}</h3>
                <Button
        variant="primary"
        className="rounded-circle mt-2"
        style={{ width: "40px", height: "40px" }}
        onClick={() => {}}
        disabled
      >
        <BsPlus size={24} />
      </Button>
                <h3> Inicia sesión para ver más detalles </h3>
              </div>
            </Card>
          </Col>

          {/* Última actualización y mapa */}
          <Col md={6} className="mb-3">
            <p className="fw-bold mb-0 text-dark" style={{ fontSize: "1.2rem" }}>
              Última actualización - 18:00
            </p>
            <div className="bg-light p-3 rounded shadow-lg">
              {sensorData && sensorData.location ? (
                <SensorMap coordinates={sensorData.location} />
              ) : (
                <p>Cargando mapa...</p>
              )}
            </div>
          </Col>;
        </Row>

        {/* Nueva fila agregada para mostrar el ID del dispositivo y la predicción con IA */}
        <Row className="mt-4 align-items-center p-3 shadow-sm rounded-4" style={{ backgroundColor: "#F8F9FA" }}>
          {/* Columna para el ID del dispositivo */}
          <Col md={2} className="d-flex flex-column align-items-center justify-content-center p-3 rounded-4" style={{ backgroundColor: "#FFFFFF" }}>
            <p className="text-muted mb-1" style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Dispositivo Actual:</p>
            <h5 className="mb-0 fw-bold">{sensorData ? sensorData.device_id : "Cargando..."}</h5>
          </Col>
          {/* Columna para la Predicción con IA */}
          <Col md={10} className="p-3 rounded-4" style={{ backgroundColor: "#FFFFFF" }}>
            <h5 className="text-center fw-bold">Predicción con IA</h5>
            <div className="d-flex justify-content-around mt-2">
              {["18:00", "19:00", "20:00", "21:00"].map((hour, index) => {
                const colors = ["#7CFC00", "#FFD700", "#9370DB", "#FF4500"];
                return (
                  <div key={index} className="text-center">
                    <p className="mb-1 fw-bold" style={{ fontSize: "0.9rem" }}>{hour}</p>
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
  );
};

export default Visitor;