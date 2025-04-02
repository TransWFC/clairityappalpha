import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Card, Container } from "react-bootstrap";
import { BsBell, BsFlag } from "react-icons/bs";
import NavbarComponent from "../components/NavbarComponent";
import SidebarComponent from "../components/SidebarComponent";
import "../Estilos/Device.css";

const DeviceManagement = () => {
  const [sensorData, setSensorData] = useState([]);
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!token) {
        navigate("/login");
      } else {
        if (user) setUserType(user.type);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error al obtener el usuario de localStorage", error);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch("/api/sensors/get");
        if (!response.ok) throw new Error("Error en la respuesta del servidor");
        const data = await response.json();

        const latestData = Object.values(
          data.reduce((acc, sensor) => {
            if (
              sensor.device_id &&
              (!acc[sensor.device_id] || new Date(sensor.timestamp) > new Date(acc[sensor.device_id].timestamp))
            ) {
              acc[sensor.device_id] = sensor;
            }
            return acc;
          }, {})
        );

        setSensorData(latestData);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "Desconocido";
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diff < 1) return "Hace menos de 1 min";
    if (diff < 60) return `Hace ${diff} min`;
    return `Hace ${Math.floor(diff / 60)} hrs`;
  };

  return (
    <div className="d-flex vh-100">
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}
      
      <div className="flex-grow-1 d-flex flex-column content-container">
        <NavbarComponent handleLogout={handleLogout} />
        
        <div className="d-flex justify-content-end gap-3 p-3">
          <BsBell size={20} className="text-dark" onClick={() => setShowModal(true)} style={{ cursor: "pointer" }} />
          <BsFlag size={20} className="text-dark" />
        </div>
        
        <Container className="mt-5 flex-grow-1">
          <h2 className="fw-bold">Gestión de dispositivos</h2>
          <Card className="shadow-sm mt-3">
            <Card.Body>
              <h4 className="text-center fw-bold">Estado de los Dispositivos</h4>
              <Table responsive bordered className="mt-3">
                <thead>
                  <tr className="table-primary text-center">
                    <th>Nombre</th>
                    <th>Estado</th>
                    <th>Calidad del Aire</th>
                    <th>Temperatura</th>
                    <th>Humedad</th>
                    <th>Última Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {sensorData.length > 0 ? (
                    sensorData.map((sensor, index) => (
                      <tr key={sensor.device_id || index} className="text-center align-middle">
                        <td>{sensor.name || `Sensor ${index + 1}`}</td>
                        <td>
                          <span className={`badge ${sensor.status === "Activo" ? "bg-success" : "bg-secondary"}`}>
                            {sensor.status || "Desconocido"}
                          </span>
                        </td>
                        <td className="d-flex align-items-center justify-content-center">
                          <span
                            className={`me-2 ${sensor.AQI <= 50 ? "text-success" : sensor.AQI <= 100 ? "text-warning" : "text-danger"}`}
                          >
                            ●
                          </span>
                          {sensor.AQI !== undefined
                            ? sensor.AQI <= 50
                              ? "Buena"
                              : sensor.AQI <= 100
                              ? "Regular"
                              : "Mala"
                            : "Desconocido"}
                        </td>
                        <td>{sensor.temperature !== undefined ? `${sensor.temperature}°C` : "N/A"}</td>
                        <td>{sensor.humidity !== undefined ? `${sensor.humidity}%` : "N/A"}</td>
                        <td>{getTimeAgo(sensor.timestamp)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No hay datos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default DeviceManagement;
