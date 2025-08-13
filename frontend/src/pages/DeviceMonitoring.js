import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Table, Badge, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  BsRouter, BsSearch, BsGrid, BsList, BsCircleFill, BsThermometer,
  BsDroplet, BsClock, BsWifi, BsWifiOff, BsBellFill, BsBellSlash, BsFlag,
  BsExclamationTriangle, BsCheckCircle, BsXCircle, BsGear
} from "react-icons/bs";
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import Footer from "../components/footer";
import "../Estilos/DeviceManagement.css";

const DeviceManagement = () => {
  const navigate = useNavigate();
  const [sensorData, setSensorData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token) {
      navigate("/login");
    } else {
      setIsAuthenticated(true);
      if (user) {
        setUserType(user.type);
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSensorData();
      const interval = setInterval(fetchSensorData, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const filtered = sensorData.filter((sensor) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        sensor.name?.toLowerCase().includes(q) ||
        sensor.device_id?.toLowerCase().includes(q) ||
        sensor.location?.toLowerCase().includes(q);

      const online = isDeviceOnline(sensor);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && online) ||
        (statusFilter === "offline" && !online);

      return matchesSearch && matchesStatus;
    });
    setFilteredData(filtered);
  }, [sensorData, searchTerm, statusFilter]);

  const fetchSensorData = async () => {
    setLoading(true);
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
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isDeviceOnline = (sensor) => {
    if (!sensor.timestamp) return false;
    const diff = Date.now() - new Date(sensor.timestamp);
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "Desconocido";
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diff < 1) return "Hace menos de 1 min";
    if (diff < 60) return `Hace ${diff} min`;
    return `Hace ${Math.floor(diff / 60)} hrs`;
  };

  const getAQIStatus = (aqi) => {
    if (aqi === undefined || aqi === null) return { label: "Desconocido", variant: "secondary", color: "#5b6375" };
    if (aqi <= 50) return { label: "Buena", variant: "success", color: "#1c7c3c" };
    if (aqi <= 100) return { label: "Moderada", variant: "warning", color: "#8a6a00" };
    if (aqi <= 150) return { label: "Dañina", variant: "orange", color: "#b45700" };
    if (aqi <= 200) return { label: "Muy Dañina", variant: "danger", color: "#a31224" };
    return { label: "Peligrosa", variant: "dark", color: "#1a1d29" };
  };

  const getDeviceIcon = (sensor) =>
    isDeviceOnline(sensor) ? <BsWifi className="dm-icon-success" /> : <BsWifiOff className="dm-icon-danger" />;

  // Surfaces
  const cardStyle = {
    border: "none",
    borderRadius: "18px",
    boxShadow: "0 8px 28px rgba(16,24,40,0.10)",
    transition: "transform .25s ease, box-shadow .25s ease",
    background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
    position: "relative",
    overflow: "hidden",
  };
  const cardHoverStyle = { transform: "translateY(-4px)", boxShadow: "0 16px 44px rgba(16,24,40,0.16)" };

  const renderGridView = () => (
    <Row className="g-3 g-md-4 dm-grid">
      {filteredData.map((sensor, index) => {
        const aqiStatus = getAQIStatus(sensor.AQI);
        const isOnline = isDeviceOnline(sensor);

        return (
          <Col key={sensor.device_id || index} xs={12} sm={6} lg={4} xl={3}>
            <Card
              style={{
                ...cardStyle,
                cursor: "pointer",
                border: isOnline ? "1px solid rgba(40,167,69,.18)" : "1px solid rgba(220,53,69,.18)",
              }}
              className="device-card-hover h-100"
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.10)";
              }}
            >
              <Card.Body className="p-3 p-lg-4 d-flex flex-column">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-3 mb-lg-4">
                  <div className="d-flex align-items-center flex-grow-1 me-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-2 me-lg-3 flex-shrink-0"
                      style={{
                        width: "50px",
                        height: "50px",
                        background: isOnline
                          ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
                          : "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                        color: "white",
                        boxShadow: "0 6px 16px rgba(16,24,40,0.18)",
                      }}
                    >
                      <BsRouter size={20} />
                    </div>
                    <div className="min-w-0 flex-grow-1">
                      <h6 className="fw-bold mb-1 dm-text-subtitle text-truncate">
                        {sensor.name || `Dispositivo ${index + 1}`}
                      </h6>
                      <p className="dm-text-subtle small mb-0 text-truncate">ID: {sensor.device_id || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="dm-chip dm-chip--soft">
                      {getDeviceIcon(sensor)}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-3 mb-lg-4">
                  <span
                    className={`dm-badge ${isOnline ? "dm-badge--success" : "dm-badge--danger"}`}
                  >
                    <BsCircleFill size={8} className="me-2" />
                    {isOnline ? "En línea" : "Desconectado"}
                  </span>
                </div>

                {/* Metrics */}
                <div className="flex-grow-1 mb-3 mb-lg-4">
                  <div className="row g-2 g-lg-3">
                    <div className="col-12">
                      <div className="dm-surface">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="dm-text-subtle small fw-semibold">Calidad del Aire</span>
                          <span
                            className="dm-badge dm-badge--pill"
                            style={{ color: aqiStatus.color, borderColor: `${aqiStatus.color}40` }}
                          >
                            {aqiStatus.label}
                          </span>
                        </div>
                        {sensor.AQI !== undefined && sensor.AQI !== null && (
                          <div className="fw-bold mt-2" style={{ fontSize: "1.2rem", color: aqiStatus.color }}>
                            {sensor.AQI} AQI
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="dm-surface">
                        <div className="d-flex align-items-center dm-text-subtle small mb-2 fw-semibold">
                          <BsThermometer size={14} className="me-2 dm-icon-primary" />
                          <span className="d-none d-sm-inline">Temperatura</span>
                          <span className="d-sm-none">Temp</span>
                        </div>
                        <div className="fw-bold dm-text-primary" style={{ fontSize: "1rem" }}>
                          {sensor.temperature !== undefined ? `${sensor.temperature}°C` : "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="dm-surface">
                        <div className="d-flex align-items-center dm-text-subtle small mb-2 fw-semibold">
                          <BsDroplet size={14} className="me-2 dm-icon-info" />
                          <span className="d-none d-sm-inline">Humedad</span>
                          <span className="d-sm-none">Hum</span>
                        </div>
                        <div className="fw-bold dm-text-info" style={{ fontSize: "1rem" }}>
                          {sensor.humidity !== undefined ? `${sensor.humidity}%` : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer row */}
                <div className="d-flex align-items-center justify-content-between dm-text-subtle small mt-auto">
                  <div className="d-flex align-items-center flex-grow-1 me-2">
                    <BsClock size={12} className="me-2 flex-shrink-0" />
                    <span className="fw-medium text-truncate">{getTimeAgo(sensor.timestamp)}</span>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="dm-btn-outline p-2"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <BsGear size={12} />
                      <span className="d-none d-lg-inline ms-1">Config</span>
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  const renderTableView = () => (
    <Card style={cardStyle} className="dm-tablecard">
      <Card.Body className="p-0">
        <div className="dm-tablewrap">
          <Table responsive className="mb-0">
            <thead className="dm-tablehead">
              <tr>
                <th className="border-0 py-3 py-lg-4 px-3 px-lg-4">Dispositivo</th>
                <th className="border-0 py-3 py-lg-4 text-center d-none d-md-table-cell">Estado</th>
                <th className="border-0 py-3 py-lg-4 text-center">Calidad del Aire</th>
                <th className="border-0 py-3 py-lg-4 text-center d-none d-lg-table-cell">Temperatura</th>
                <th className="border-0 py-3 py-lg-4 text-center d-none d-lg-table-cell">Humedad</th>
                <th className="border-0 py-3 py-lg-4 text-center d-none d-sm-table-cell">Última Actualización</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((sensor, index) => {
                  const aqiStatus = getAQIStatus(sensor.AQI);
                  const isOnline = isDeviceOnline(sensor);
                  return (
                    <tr
                      key={sensor.device_id || index}
                      className="align-middle dm-row"
                    >
                      <td className="py-3 py-lg-4 px-3 px-lg-4">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center me-2 me-lg-3 flex-shrink-0"
                            style={{
                              width: "40px",
                              height: "40px",
                              background: isOnline
                                ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
                                : "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                              color: "white",
                              boxShadow: "0 4px 12px rgba(16,24,40,0.15)",
                            }}
                          >
                            <BsRouter size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="fw-semibold dm-text-title mb-1 text-truncate" style={{ fontSize: "0.95rem" }}>
                              {sensor.name || `Dispositivo ${index + 1}`}
                            </div>
                            <div className="dm-text-subtle small text-truncate">ID: {sensor.device_id || "N/A"}</div>
                            {/* Show status on mobile */}
                            <div className="d-md-none mt-1">
                              <span className={`dm-badge ${isOnline ? "dm-badge--success" : "dm-badge--danger"}`}>
                                <BsCircleFill size={6} className="me-1" />
                                {isOnline ? "En línea" : "Offline"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 py-lg-4 d-none d-md-table-cell">
                        <span className={`dm-badge ${isOnline ? "dm-badge--success" : "dm-badge--danger"}`}>
                          <BsCircleFill size={6} className="me-2" />
                          {isOnline ? "En línea" : "Desconectado"}
                        </span>
                      </td>
                      <td className="text-center py-3 py-lg-4">
                        <div className="d-flex flex-column align-items-center">
                          <span
                            className="dm-badge dm-badge--pill mb-1 mb-lg-2"
                            style={{ color: aqiStatus.color, borderColor: `${aqiStatus.color}40` }}
                          >
                            {aqiStatus.label}
                          </span>
                          {sensor.AQI !== undefined && sensor.AQI !== null && (
                            <small className="fw-bold" style={{ color: aqiStatus.color }}>
                              {sensor.AQI} AQI
                            </small>
                          )}
                          {/* Show temp/humidity on mobile */}
                          <div className="d-lg-none mt-2">
                            <div className="d-flex gap-3 justify-content-center">
                              <div className="text-center">
                                <div className="dm-chip dm-chip--soft mb-1">
                                  <BsThermometer size={12} className="dm-icon-primary" />
                                </div>
                                <small className="fw-bold dm-text-primary">
                                  {sensor.temperature !== undefined ? `${sensor.temperature}°C` : "N/A"}
                                </small>
                              </div>
                              <div className="text-center">
                                <div className="dm-chip dm-chip--soft mb-1">
                                  <BsDroplet size={12} className="dm-icon-info" />
                                </div>
                                <small className="fw-bold dm-text-info">
                                  {sensor.humidity !== undefined ? `${sensor.humidity}%` : "N/A"}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 py-lg-4 d-none d-lg-table-cell">
                        <div className="d-flex align-items-center justify-content-center">
                          <div className="dm-chip dm-chip--soft me-2">
                            <BsThermometer size={16} className="dm-icon-primary" />
                          </div>
                          <span className="fw-bold dm-text-primary">{sensor.temperature !== undefined ? `${sensor.temperature}°C` : "N/A"}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 py-lg-4 d-none d-lg-table-cell">
                        <div className="d-flex align-items-center justify-content-center">
                          <div className="dm-chip dm-chip--soft me-2">
                            <BsDroplet size={16} className="dm-icon-info" />
                          </div>
                          <span className="fw-bold dm-text-info">{sensor.humidity !== undefined ? `${sensor.humidity}%` : "N/A"}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 py-lg-4 d-none d-sm-table-cell">
                        <div className="d-flex align-items-center justify-content-center dm-text-subtle">
                          <BsClock size={14} className="me-2" />
                          <span className="small fw-medium">{getTimeAgo(sensor.timestamp)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="dm-text-subtle">
                      <BsExclamationTriangle size={32} className="mb-3 dm-icon-warning" />
                      <h5 className="fw-semibold mb-2">
                        {searchTerm || statusFilter !== "all" ? "No se encontraron dispositivos" : "No hay dispositivos disponibles"}
                      </h5>
                      <p className="mb-0">
                        {searchTerm || statusFilter !== "all"
                          ? "Intenta ajustar los filtros de búsqueda"
                          : "Configura tu primer dispositivo para comenzar"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );

  if (!isAuthenticated) return null;

  const onlineDevices = filteredData.filter((s) => isDeviceOnline(s)).length;
  const offlineDevices = filteredData.filter((s) => !isDeviceOnline(s)).length;

  return (
    <LayoutWithSidebar>
      <div
        className="d-flex flex-column min-vh-100 device-page dm-container"
        style={{
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          paddingTop: "60px",
          background: "linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%)",
        }}
      >
        <div
          className="flex-grow-1 d-flex flex-column"
          style={{
            overflow: "auto",
            padding: "0 12px 24px",
          }}
        >
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-md-center py-3 py-lg-4 gap-3 dm-device-header">
            <div className="w-100 w-md-auto">
              <h1 className="fw-bold mb-1 device-title">
                Gestión de Dispositivos
              </h1>
              <p className="mb-0 dm-text-subtle" style={{ fontSize: "1rem" }}>
                Monitorea el estado y métricas de todos los dispositivos IoT
              </p>
            </div>
          </div>

          <Container fluid className="px-0">
            {/* Stats */}
            <Row className="g-3 g-lg-4 mb-4 mb-lg-5 dm-stats">
              <Col xs={6} sm={6} md={3}>
                <Card
                  style={cardStyle}
                  className="device-card-hover h-100"
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.10)";
                  }}
                >
                  <Card.Body className="p-3 p-lg-4 text-center">
                    <div className="d-flex align-items-center justify-content-center mb-2 mb-lg-3">
                      <div className="dm-chip dm-chip--brand">
                        <BsRouter size={18} className="dm-icon-primary" />
                      </div>
                    </div>
                    <h3 className="fw-bold mb-1 mb-lg-2 dm-text-title-lg">{filteredData.length}</h3>
                    <p className="dm-text-subtle mb-0 fw-semibold small">Total Dispositivos</p>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={6} sm={6} md={3}>
                <Card
                  style={cardStyle}
                  className="device-card-hover h-100"
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.10)";
                  }}
                >
                  <Card.Body className="p-3 p-lg-4 text-center">
                    <div className="d-flex align-items-center justify-content-center mb-2 mb-lg-3">
                      <div className="dm-chip dm-chip--success">
                        <BsCheckCircle size={18} />
                      </div>
                    </div>
                    <h3 className="fw-bold mb-1 mb-lg-2 dm-text-success">{onlineDevices}</h3>
                    <p className="dm-text-subtle mb-0 fw-semibold small">En Línea</p>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={6} sm={6} md={3}>
                <Card
                  style={cardStyle}
                  className="device-card-hover h-100"
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.10)";
                  }}
                >
                  <Card.Body className="p-3 p-lg-4 text-center">
                    <div className="d-flex align-items-center justify-content-center mb-2 mb-lg-3">
                      <div className="dm-chip dm-chip--danger">
                        <BsXCircle size={18} />
                      </div>
                    </div>
                    <h3 className="fw-bold mb-1 mb-lg-2 dm-text-danger">{offlineDevices}</h3>
                    <p className="dm-text-subtle mb-0 fw-semibold small">Desconectados</p>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={6} sm={6} md={3}>
                <Card
                  style={cardStyle}
                  className="device-card-hover h-100"
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(16,24,40,0.10)";
                  }}
                >
                  <Card.Body className="p-3 p-lg-4 text-center">
                    <div className="d-flex align-items-center justify-content-center mb-2 mb-lg-3">
                      <div className="dm-chip dm-chip--info">
                        <BsClock size={16} />
                      </div>
                    </div>
                    <h5 className="fw-bold mb-1 mb-lg-2 dm-text-title">
                      {lastUpdate
                        ? lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "--:--"}
                    </h5>
                    <p className="dm-text-subtle mb-0 fw-semibold small">Última Actualización</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Controls */}
            <Card style={cardStyle} className="mb-4 mb-lg-5 dm-controls">
              <Card.Body className="p-3 p-lg-4">
                <div className="dm-controls-wrapper">
                  <div className="dm-controls-left">
                    {/* Search */}
                    <InputGroup className="dm-search">
                      <InputGroup.Text className="dm-search__prefix">
                        <BsSearch size={16} className="dm-icon-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Buscar dispositivos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="dm-search__input"
                      />
                    </InputGroup>

                    {/* Status */}
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="dm-select"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="active">En línea</option>
                      <option value="offline">Desconectados</option>
                    </Form.Select>
                  </div>

                  <div className="dm-controls-right">
                    <Button
                      variant="outline-primary"
                      onClick={fetchSensorData}
                      disabled={loading}
                      className="dm-btn-outline"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          <span className="d-none d-sm-inline">Actualizando...</span>
                          <span className="d-sm-none">...</span>
                        </>
                      ) : (
                        <>
                          <span className="d-none d-sm-inline">Actualizar</span>
                          <span className="d-sm-none">↻</span>
                        </>
                      )}
                    </Button>

                    <div className="dm-toggle">
                      <Button
                        variant={viewMode === "grid" ? "primary" : "light"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="dm-toggle__btn"
                        aria-pressed={viewMode === "grid"}
                        aria-label="Vista de tarjetas"
                      >
                        <BsGrid size={16} />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "primary" : "light"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className="dm-toggle__btn"
                        aria-pressed={viewMode === "table"}
                        aria-label="Vista de tabla"
                      >
                        <BsList size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Content */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-4 dm-loading-spinner" role="status" />
                <h5 className="fw-semibold mb-2">Cargando dispositivos...</h5>
                <p className="dm-text-subtle">Obteniendo datos de sensores</p>
              </div>
            ) : filteredData.length === 0 ? (
              <Card style={cardStyle}>
                <Card.Body className="p-4 p-lg-5 text-center">
                  <BsExclamationTriangle size={48} className="dm-icon-muted mb-4" />
                  <h4 className="fw-semibold mb-3">No se encontraron dispositivos</h4>
                  <p className="dm-text-subtle mb-4" style={{ fontSize: "1rem" }}>
                    {searchTerm || statusFilter !== "all"
                      ? "Intenta ajustar los filtros de búsqueda"
                      : "No hay dispositivos registrados en el sistema"}
                  </p>
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    className="dm-btn-outline"
                  >
                    Limpiar Filtros
                  </Button>
                </Card.Body>
              </Card>
            ) : viewMode === "grid" ? (
              renderGridView()
            ) : (
              renderTableView()
            )}
          </Container>
        </div>

        <Footer />
      </div>
    </LayoutWithSidebar>
  );
};

export default DeviceManagement;