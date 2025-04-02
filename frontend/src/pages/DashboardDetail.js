import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Navbar, Container, Row, Col, Button, Modal, Form } from "react-bootstrap";
import { BsCloud, BsSun, BsBoxArrowRight, BsBell, BsFlag, BsPlus } from "react-icons/bs";
import AirQualityChart from "../components/AirQualityChart"; // Import the component
import WeeklyAirQualityChart from "../components/WeeklyAirQualityChart"; // Import the weekly chart component
import { useNavigate } from "react-router-dom";
import SensorMap from "../components/GoogleMap"; // Ajusta la ruta según tu estructura
import moment from "moment-timezone";
import NavbarComponent from "../components/NavbarComponent"; // Asegúrate de que la ruta es correcta
import SidebarComponent from "../components/SidebarComponent";
import "../Estilos/DashboardDetail.css";

const DashboardDetail = () => {
    const navigate = useNavigate();
    const [sensorData, setSensorData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [historicalData, setHistoricalData] = useState([]);
    const [groups, setGroups] = useState([]);
    const [currentTime, setCurrentTime] = useState(moment().tz("America/Mexico_City").format("HH:mm"));
    const [userType, setUserType] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showModal1, setShowModal1] = useState(false);
    const [showModal2, setShowModal2] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(250); // Estado para el ancho de la sidebar

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
        const fetchSensorData = async () => {
            try {
                const response = await fetch("/api/sensors/get");
                const data = await response.json();
                if (data.length > 0) {
                    setSensorData(data[0]);
                    fetchRecommendations(data[0].AQI);
                    fetchGroups(data[0].AQI);
                }
            } catch (error) {
                console.error("Error fetching sensor data:", error);
            }
        };

        const fetchHistoricalData = async () => {
            try {
                const response = await fetch("/api/sensors/history");
                const data = await response.json();
                console.log("Fetched Data:", data); // Debugging
                setHistoricalData(data);
            } catch (error) {
                console.error("Error fetching historical data:", error);
            }
        };
        fetchHistoricalData();

        const fetchRecommendations = async (aqi) => {
            try {
                const response = await fetch(`/api/recommendations?aqi=${aqi}`);
                const data = await response.json();
                setRecommendations(data.recommendations);
            } catch (error) {
                console.error("Error fetching recommendations:", error);
            }
        };

        const fetchGroups = async (aqi) => {
            try {
                const response = await fetch(`/api/groups?aqi=${aqi}`);
                const data = await response.json();
                setGroups(data.groups);
            } catch (error) {
                console.error("Error fetching groups:", error);
            }
        };

        fetchSensorData();
    }, []);

    if (!isAuthenticated) {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const aqi = sensorData ? sensorData.AQI : 0;
    const backgroundColor = (() => {
        if (aqi <= 50) return "#00E400"; // Bueno
        if (aqi <= 100) return "#FFFF00"; // Moderado
        if (aqi <= 150) return "#FF7E00"; // No saludable
        return "#800080"; // Peligroso
    })();

    return (
        <div className="d-flex vh-100" style={{ fontFamily: "Raleway, sans-serif" }}>
            {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}
            
            <div
                className="d-flex flex-column flex-grow-1"
                style={{
                    transition: "margin-left 0.3s ease-in-out",
                    marginLeft: `${sidebarWidth}px`, // Uso del estado para el margen
                }}
            >
                {/* Navbar fijo en la parte superior */}
                <NavbarComponent handleLogout={handleLogout} className="fixed-top" />
                
                {/* Contenedor con padding superior para evitar que el contenido quede oculto bajo el Navbar fijo */}
                <div style={{ paddingTop: "80px" }}>
                    <Container className="mt-3 flex-grow-1">
                        {/* AQI Section */}
                        <Row>
                            <Col md={12} className="mb-3">
                                <Card className="d-flex flex-row shadow-lg rounded-4 overflow-hidden border-0">
                                    <div
                                        className="p-4 d-flex flex-column align-items-start shadow-lg position-relative"
                                        style={{ width: "40%", minHeight: "250px", backgroundColor }}
                                    >
                                        <p className="fw-bold mb-1 text-white" style={{ fontSize: "1.2rem" }}>Calidad actual:</p>
                                        <h4 className="mb-2 text-dark" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                            {sensorData ? sensorData.AQI : "--"}
                                        </h4>
                                        <BsCloud size={130} className="text-white position-absolute" style={{ top: "10px", right: "20px" }} />
                                        <p className="fw-semibold text-white position-absolute" style={{ fontSize: "1.2rem", top: "120px", right: "30px" }}>US AQI</p>
                                        <h2 className="fw-bold text-dark position-absolute" style={{ fontSize: "3rem", top: "150px", right: "30px" }}>
                                            {sensorData ? sensorData.AQI : "--"}
                                        </h2>
                                    </div>
                                    <div className="p-3 d-flex flex-column align-items-end justify-content-start w-100 text-end" style={{ backgroundColor: "white" }}>
                                        <div className="d-flex align-items-center">
                                            <BsSun size={24} className="text-dark me-2" />
                                            <span className="fw-bold text-dark" style={{ fontSize: "1.2rem" }}>
                                                {sensorData ? `${sensorData.temperature}°` : "--"}
                                            </span>
                                        </div>
                                        <p className="fw-bold text-dark my-1">Santiago de Querétaro, Qro.</p>
                                        <h3 className="fw-bold text-dark">{currentTime}</h3>
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        {/* Recomendaciones */}
                        <Row>
                            <Col md={12} className="mb-3">
                                <Card className="p-4 shadow-lg rounded-4 border-0">
                                    <h4 className="fw-bold text-dark text-center">Recomendaciones</h4>
                                    <div className="recommendation-container">
                                        {recommendations.length > 0 ? (
                                            <div className="d-flex overflow-auto">
                                                {recommendations.map((rec, index) => (
                                                    <div key={index} className="recommendation-card">
                                                        <p className="text-dark fw-bold">{rec}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-dark text-center">Cargando recomendaciones...</p>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        {/* Grupos vulnerables */}
                        <Row>
                            <Col md={12} className="mb-3">
                                <Card className="p-4 shadow-lg rounded-4 border-0">
                                    <h4 className="fw-bold text-dark text-center">Grupos Vulnerables</h4>
                                    <div className="group-container">
                                        {groups.length > 0 ? (
                                            <ul className="list-group">
                                                {groups.map((group, index) => (
                                                    <li key={index} className="list-group-item text-dark">{group}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-dark text-center">Cargando grupos vulnerables...</p>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        {/* Gráficas de calidad del aire */}
                        <Row>
                            <Col md={12} className="mb-3">
                                <Card className="shadow-sm rounded-4 p-3 position-relative">
                                    <Button
                                        className="position-absolute top-0 end-0 m-2"
                                        variant="outline-dark"
                                        onClick={() => setShowModal1(true)}
                                    >
                                        Expandir
                                    </Button>
                                    {historicalData.length > 0 ? (
                                        <AirQualityChart data={historicalData} />
                                    ) : (
                                        <p className="text-dark text-center">Cargando datos históricos...</p>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12} className="mb-3">
                                <Card className="shadow-sm rounded-4 p-3 position-relative">
                                    {historicalData.length > 0 ? (
                                        <WeeklyAirQualityChart data={historicalData} />
                                    ) : (
                                        <p className="text-dark text-center">Cargando datos semanales...</p>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        {/* Modal de expansión de gráfica 1 */}
                        <Modal show={showModal1} onHide={() => setShowModal1(false)} size="lg">
                            <Modal.Header closeButton>
                                <Modal.Title>Gráfica de calidad del aire</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                {historicalData.length > 0 ? (
                                    <AirQualityChart data={historicalData} />
                                ) : (
                                    <p className="text-dark text-center">Cargando datos históricos...</p>
                                )}
                            </Modal.Body>
                        </Modal>

                        {/* Modal de expansión de gráfica 2 */}
                        <Modal show={showModal2} onHide={() => setShowModal2(false)} size="lg">
                            <Modal.Header closeButton>
                                <Modal.Title>Gráfica semanal de calidad del aire</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                {historicalData.length > 0 ? (
                                    <WeeklyAirQualityChart data={historicalData} />
                                ) : (
                                    <p className="text-dark text-center">Cargando datos semanales...</p>
                                )}
                            </Modal.Body>
                        </Modal>

                    </Container>
                </div>
            </div>
        </div>
    );
};

export default DashboardDetail;
