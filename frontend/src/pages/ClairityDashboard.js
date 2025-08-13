import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Carousel, Card, Container, Row, Col, Button, Form } from "react-bootstrap";
import { BsCloud, BsSun, BsFlag, BsPlus, BsBellFill, BsBellSlash, BsPeople } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import SensorMap from "../components/GoogleMap";
import AQIDecompositionChart from "../components/AQIDecompositionChart";
import Heatmap from "../components/CorrelationHeatmap"; // Import Heatmap component
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import Footer from "../components/footer"; // Import the new Footer component
import "../Estilos/ClairityDashboard.css";
import AirQualityChart from "../components/AirQualityChart";

const ClarityDashboard = () => {
  const navigate = useNavigate();
  const [currentSensorData, setCurrentSensorData] = useState(null); // Unified current data
  const [sensorLatest, setSensorLatest] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(moment().tz("America/Mexico_City").format("HH:mm"));
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [name, setName] = useState("");
  const [hourlyAQIData, setHourlyAQIData] = useState([]);
  const [hourlyAverage, setHourlyAverage] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [groups, setGroups] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isRealTime, setIsRealTime] = useState(false); // Track if data is real-time

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
    const fetchHourlyAQIData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/history?filter=hour");
        const data = await response.json();

        if (!Array.isArray(data)) return;

        const grouped = {};
        data.forEach(entry => {
          const date = new Date(entry.timestamp);
          const key = date.getHours() + ":" + date.getMinutes().toString().padStart(2, '0');
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(entry.AQI || entry.aqi);
        });

        const averagedData = Object.entries(grouped).map(([time, values]) => {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          return { time, avg: Math.round(avg) };
        });

        setHourlyAQIData(averagedData);
        const overallAvg = averagedData.reduce((sum, d) => sum + d.avg, 0) / averagedData.length;
        setHourlyAverage(Math.round(overallAvg));
        setLastUpdate(moment().fromNow());
      } catch (error) {
        console.error("Error fetching hourly AQI:", error);
      }
    };

    fetchHourlyAQIData();
  }, []);

  // Move these functions outside useEffect so they can be reused
  const fetchRecommendations = async (currentAQI) => {
    try {
      console.log('Fetching recommendations for AQI:', currentAQI);
      const response = await fetch(`http://localhost:5000/api/recommendations?aqi=${currentAQI}`);
      const data = await response.json();
      console.log('Recommendations response:', data);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendations([]);
    }
  };

  const fetchGroups = async (currentAQI) => {
    try {
      console.log('Fetching groups for AQI:', currentAQI);
      const response = await fetch(`http://localhost:5000/api/groups?aqi=${currentAQI}`);
      const data = await response.json();
      console.log('Groups response:', data);
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    }
  };

  // Unified data fetching function
  const fetchLatestData = async () => {
    let realtimeData = null;
    let latestDbData = null;

    try {
      // Try to get real-time data first
      const realtimeResponse = await fetch("http://localhost:5000/api/sensors/latest");
      if (realtimeResponse.ok) {
        realtimeData = await realtimeResponse.json();

        // Check if the data is recent (within last 5 minutes)
        if (realtimeData && realtimeData.timestamp) {
          const dataAge = Date.now() - new Date(realtimeData.timestamp).getTime();
          const fiveMinutes = 5 * 60 * 1000;

          if (dataAge <= fiveMinutes) {
            setCurrentSensorData(realtimeData);
            setIsRealTime(true);
            return realtimeData;
          }
        }
      }
    } catch (err) {
      console.error("Error fetching real-time data:", err);
    }

    try {
      // Fall back to latest database records
      const dbResponse = await fetch("http://localhost:5000/api/sensors/get");
      if (!dbResponse.ok) throw new Error("Error en la respuesta del servidor");
      const dbData = await dbResponse.json();

      const latestData = Object.values(
        dbData.reduce((acc, sensor) => {
          if (
            sensor.device_id &&
            (!acc[sensor.device_id] || new Date(sensor.timestamp) > new Date(acc[sensor.device_id].timestamp))
          ) {
            acc[sensor.device_id] = sensor;
          }
          return acc;
        }, {})
      );

      setSensorLatest(latestData);

      // Use the most recent entry as current data
      if (latestData.length > 0) {
        const mostRecent = latestData.reduce((latest, current) =>
          new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
        );
        setCurrentSensorData(mostRecent);
        setIsRealTime(false);
        return mostRecent;
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      alert("No se pudieron obtener los datos del sensor.");
    }
    return null;
  };

  // Updated useEffect with proper dependency handling
  useEffect(() => {
    if (isAuthenticated) {
      const runAllFetches = async () => {
        try {
          const latestData = await fetchLatestData();
          
          if (latestData) {
            const currentAQI = latestData.AQI || latestData.aqi;
            if (currentAQI !== null && currentAQI !== undefined) {
              // Fetch recommendations and groups with the current AQI
              await Promise.all([
                fetchRecommendations(currentAQI),
                fetchGroups(currentAQI)
              ]);
            }
          }
        } catch (error) {
          console.error("Error in runAllFetches:", error);
        }
      };

      // Initial fetch
      runAllFetches();

      // Set up interval for periodic updates
      const interval = setInterval(runAllFetches, 5000);

      // Clear on unmount
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Separate useEffect to handle recommendations and groups when currentSensorData changes
  useEffect(() => {
    if (currentSensorData) {
      const currentAQI = currentSensorData.AQI || currentSensorData.aqi;
      if (currentAQI !== null && currentAQI !== undefined) {
        fetchRecommendations(currentAQI);
        fetchGroups(currentAQI);
      }
    }
  }, [currentSensorData]);

  if (!isAuthenticated) {
    return null;
  }

  const toggleAlerts = async () => {
    try {
      const newValue = !alertsEnabled;
      const res = await fetch(`http://localhost:5000/api/users/${userId}/toggle-alerts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ alertsEnabled: newValue }),
      });

      const data = await res.json();

      if (res.ok) {
        setAlertsEnabled(newValue);
        const user = JSON.parse(localStorage.getItem("user"));
        user.alerts = newValue;
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        console.error("Error al actualizar las alertas:", data.message);
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { label: 'Bueno', className: 'bg-success' };
    if (aqi <= 100) return { label: 'Moderado', className: 'bg-warning text-dark' };
    if (aqi <= 150) return { label: 'Dañino', className: 'bg-orange text-dark' };
    if (aqi <= 200) return { label: 'Muy Dañino', className: 'bg-purple' };
    return { label: 'Peligroso', className: 'bg-dark' };
  };

  const getAQIGradient = (aqi) => {
    if (aqi === null || aqi === undefined) {
      return 'linear-gradient(135deg,rgb(61, 61, 61) 0%,rgb(182, 182, 182) 100%)';
    } else if (aqi <= 50) {
      return 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
    } else if (aqi <= 100) {
      return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
    } else if (aqi <= 150) {
      return 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)';
    } else if (aqi <= 200) {
      return 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)';
    } else {
      return 'linear-gradient(135deg, #8b5a3c 0%, #6b4423 100%)';
    }
  };

  // Helper function to get the current AQI value
  const getCurrentAQI = () => {
    if (!currentSensorData) return null;
    return currentSensorData.AQI || currentSensorData.aqi;
  };

  // Helper function to get data age status
  const getDataStatus = () => {
    if (!currentSensorData || !currentSensorData.timestamp) return "Sin datos";

    const dataAge = Date.now() - new Date(currentSensorData.timestamp).getTime();
    const minutes = Math.floor(dataAge / (1000 * 60));

    if (isRealTime && minutes <= 5) {
      return "En tiempo real";
    } else if (minutes < 60) {
      return `${minutes} min atrás`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours}h atrás`;
    }
  };

  const dashboardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  };

  const cardStyle = {
    border: 'none',
    borderRadius: '20px', // Increased from 16px
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', // Enhanced shadow
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Smooth transition
    background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
    position: 'relative',
    overflow: 'hidden'
  };

  // Add subtle animation on hover
  const cardHoverStyle = {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.18)'
  };

  const primaryCardStyle = {
    ...cardStyle,
    background: getAQIGradient(getCurrentAQI()),
    color: 'white',
    minHeight: '240px', // Increased height
    position: 'relative',
    overflow: 'hidden'
  };

  // Enhanced background animation
  const backgroundPattern = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
    zIndex: 1
  };

  return (
    <LayoutWithSidebar>
      <div className="d-flex flex-column min-vh-100" style={{
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        paddingTop: "60px",
        background: 'linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%)'
      }}>
        <div
          className="flex-grow-1 d-flex flex-column"
          style={{
            overflow: "auto",
            marginLeft: userType === "admin" ? "0px" : "0",
            marginRight: userType === "admin" ? "0px" : "0",
            padding: '0 24px',
            paddingBottom: '24px',
          }}
        >
          {/* Header Controls */}
          <div className="d-flex justify-content-between align-items-center py-4">
            <div>
              <h1 className="fw-bold mb-1" style={{
                fontSize: "2.8rem", // Increased from 2.5rem
                color: "#1a1d29",
                letterSpacing: '-0.03em', // Tighter letter spacing
                background: 'linear-gradient(135deg, #1a1d29 0%, #495057 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ¡Hola, {name}!
              </h1>
              <p className="mb-0 text-muted" style={{ 
                fontSize: "1.15rem", // Slightly increased
                fontWeight: '400',
                opacity: 0.8
              }}>
                {userType === "admin"
                  ? "Panel de administración - Gestiona datos y dispositivos"
                  : "Monitorea la calidad del aire en tiempo real"}
              </p>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div 
                className="d-flex align-items-center bg-white rounded-pill px-4 py-3 shadow-sm"
                style={{
                  border: '1px solid rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {alertsEnabled ? (
                  <BsBellFill size={18} className="text-primary me-2" />
                ) : (
                  <BsBellSlash size={18} className="text-secondary me-2" />
                )}
                <Form.Check
                  type="switch"
                  id="alerts-switch"
                  checked={alertsEnabled}
                  onChange={toggleAlerts}
                  className="mb-0"
                  style={{
                    transform: 'scale(1.1)' // Slightly larger switch
                  }}
                />
              </div>
              <div 
                className="bg-white rounded-circle p-3 shadow-sm"
                style={{
                  border: '1px solid rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <BsFlag size={18} className="text-primary" />
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <Container fluid className="px-0">
            {/* Hero AQI Card */}
            <Row className="mb-5">
              <Col xs={12}>
                <Card 
                  style={primaryCardStyle} 
                  className="overflow-hidden position-relative"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 64px rgba(0,0,0,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                  }}
                >
                  <div style={backgroundPattern}></div>
                  <Card.Body className="p-5 position-relative" style={{ zIndex: 2 }}>
                    <div className="row h-100">
                      <div className="col-md-8 d-flex flex-column justify-content-between">
                        <div>
                          <p className="mb-3 opacity-90" style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: '500',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            Calidad del Aire Actual
                          </p>
                          <h2 className="display-1 fw-bold mb-4" style={{ 
                            lineHeight: '0.9',
                            fontSize: '5rem', // Larger display
                            textShadow: '0 4px 8px rgba(0,0,0,0.2)'
                          }}>
                            {getCurrentAQI() || "--"}
                          </h2>
                          <div className="d-flex align-items-center gap-3 flex-wrap">
                            <span className="badge bg-white bg-opacity-25 px-4 py-2 text-white" style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                              US AQI
                            </span>
                            {getCurrentAQI() && (
                              <span className="badge bg-white bg-opacity-20 px-4 py-2 text-white" style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.2)'
                              }}>
                                {getAQIStatus(getCurrentAQI()).label}
                              </span>
                            )}
                            <span className={`badge ${isRealTime ? 'bg-success' : 'bg-white'} bg-opacity-25 px-4 py-2 text-white`} style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                              {isRealTime ? '● En vivo' : '○ Histórico'}
                            </span>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-end mt-4">
                          <div>
                            <p className="mb-1 opacity-80" style={{ fontSize: '1rem' }}>Santiago de Querétaro, Qro.</p>
                            <p className="mb-0 fw-bold" style={{ 
                              fontSize: '1.4rem',
                              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>{currentTime}</p>
                          </div>
                          <div className="text-end">
                            <div className="d-flex align-items-center mb-2">
                              <BsSun size={24} className="me-3" />
                              <span style={{ 
                                fontSize: '1.3rem', 
                                fontWeight: '600',
                                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                {currentSensorData ? `${currentSensorData.temperature}°C` : "--"}
                              </span>
                            </div>
                            <p className="mb-0 opacity-80 small">
                              {getDataStatus()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4 d-flex align-items-center justify-content-center">
                        <BsCloud size={140} className="opacity-30" style={{
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                        }} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Grid Layout for Cards */}
            <div style={dashboardGridStyle}>
              {/* Device Status Card */}
              <Card 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                }}
              >
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <h5 className="fw-semibold mb-0" style={{ 
                      color: '#1a1d29',
                      fontSize: '1.1rem'
                    }}>Estado de Dispositivos</h5>
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3" style={{
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                      <BsCloud size={18} className="text-primary" />
                    </div>
                  </div>

                  {currentSensorData ? (
                    <div className="border rounded-4 p-4 bg-light bg-opacity-60" style={{
                      borderColor: 'rgba(0,0,0,0.08) !important',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="fw-medium mb-2" style={{ fontSize: '1rem' }}>{currentSensorData.location || "Sede Principal"}</p>
                          <p className="text-muted small mb-0">
                            {new Date(currentSensorData.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold mb-2" style={{ 
                            fontSize: '1.4rem',
                            color: getAQIStatus(getCurrentAQI()).className.includes('success') ? '#28a745' : 
                                   getAQIStatus(getCurrentAQI()).className.includes('warning') ? '#ffc107' : '#dc3545'
                          }}>
                            {getCurrentAQI()}
                          </div>
                          <span className={`badge ${getAQIStatus(getCurrentAQI()).className} px-3 py-2`} style={{
                            fontSize: '0.8rem'
                          }}>
                            {getAQIStatus(getCurrentAQI()).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2rem', height: '2rem' }}></div>
                      <p className="mb-0">Cargando datos...</p>
                    </div>
                  )}

                  {/* Show additional devices if available */}
                  {sensorLatest && sensorLatest.length > 1 && (
                    <div className="mt-4">
                      <p className="small text-muted mb-3 fw-semibold">Otros dispositivos:</p>
                      {sensorLatest.slice(1, 3).map((sensor, index) => (
                        <div key={index} className="border rounded-3 p-3 mb-2 bg-light bg-opacity-40" style={{
                          borderColor: 'rgba(0,0,0,0.06) !important'
                        }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small fw-medium">{sensor.location || `Dispositivo ${sensor.device_id}`}</span>
                            <span className="small fw-bold text-primary">{sensor.aqi || sensor.AQI}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Card 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                }}
              >
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <h5 className="fw-semibold mb-0" style={{ color: '#1a1d29', fontSize: '1.1rem' }}>Recomendaciones</h5>
                    <div className="bg-success bg-opacity-10 rounded-circle p-3" style={{
                      border: '1px solid rgba(40, 167, 69, 0.2)'
                    }}>
                      <BsFlag size={18} className="text-success" />
                    </div>
                  </div>
                  {recommendations.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="bg-primary bg-opacity-10 rounded-4 p-4" style={{
                          border: '1px solid rgba(102, 126, 234, 0.15)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(102, 126, 234, 0.15)';
                          e.target.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                          e.target.style.transform = 'translateX(0)';
                        }}>
                          <p className="mb-0 text-dark fw-medium" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{rec}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <div className="spinner-border text-primary mb-3" role="status"></div>
                      <p className="mb-0">Cargando recomendaciones...</p>
                      {currentSensorData && (
                        <p className="mb-0 small">AQI actual: {getCurrentAQI()}</p>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Card 
                style={cardStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                }}
              >
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <h5 className="fw-semibold mb-0" style={{ color: '#1a1d29', fontSize: '1.1rem' }}>Grupos Vulnerables</h5>
                    <div className="bg-warning bg-opacity-10 rounded-circle p-3" style={{
                      border: '1px solid rgba(255, 193, 7, 0.2)'
                    }}>
                      <BsPeople size={18} className="text-warning" />
                    </div>
                  </div>
                  {groups.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {groups.map((group, index) => (
                        <div key={index} className="bg-warning bg-opacity-10 rounded-4 p-4" style={{
                          border: '1px solid rgba(255, 193, 7, 0.15)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(255, 193, 7, 0.15)';
                          e.target.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                          e.target.style.transform = 'translateX(0)';
                        }}>
                          <p className="mb-0 text-dark fw-medium" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{group}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <div className="spinner-border text-warning mb-3" role="status"></div>
                      <p className="mb-0">Cargando grupos vulnerables...</p>
                      {currentSensorData && (
                        <p className="mb-0 small">AQI actual: {getCurrentAQI()}</p>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>

            {/* Charts Carousel */}
            <div className="mb-5">
              <Carousel interval={null} indicators={true} className="custom-carousel">
                <Carousel.Item>
                  <Card 
                    style={cardStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    }}
                  >
                    <Card.Body className="p-4">
                      <AirQualityChart />
                    </Card.Body>
                  </Card>
                </Carousel.Item>
                <Carousel.Item>
                  <Card 
                    style={cardStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    }}
                  >
                    <Card.Body className="p-4">
                      <Heatmap />
                    </Card.Body>
                  </Card>
                </Carousel.Item>
                <Carousel.Item>
                  <Card 
                    style={cardStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    }}
                  >
                    <Card.Body className="p-4">
                      <AQIDecompositionChart />
                    </Card.Body>
                  </Card>
                </Carousel.Item>
              </Carousel>
            </div>

            {/* Map Section */}
            <Row>
              <Col xs={12}>
                <Card 
                  style={cardStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                  }}
                >
                  <Card.Body className="p-4">
                    <SensorMap />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
        {/* Footer */}
        <Footer />
      </div>
    </LayoutWithSidebar>
  );
};

export default ClarityDashboard;