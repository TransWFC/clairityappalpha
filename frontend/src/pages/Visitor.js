import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { BsCloud, BsBellFill, BsPeople, BsFlag } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import GuestNavbar from "../components/GuestNavbar";
import Footer from "../components/footer";

const Visitor = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
      navigate("/dashboard");
    }
  }, [navigate]);

  const [nowStr, setNowStr] = useState(
    moment().tz("America/Mexico_City").format("HH:mm")
  );
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [error, setError] = useState("");

  const getAQIStatus = (aqi) => {
    if (aqi == null) return { label: "Sin datos", className: "bg-secondary" };
    if (aqi <= 50) return { label: "Bueno", className: "bg-success" };
    if (aqi <= 100) return { label: "Moderado", className: "bg-warning text-dark" };
    if (aqi <= 150) return { label: "Dañino", className: "bg-orange text-dark" };
    if (aqi <= 200) return { label: "Muy Dañino", className: "bg-purple" };
    return { label: "Peligroso", className: "bg-dark" };
  };

  const getAQIGradient = (aqi) => {
    if (aqi == null) {
      return "linear-gradient(135deg,rgb(61,61,61) 0%,rgb(182,182,182) 100%)";
    } else if (aqi <= 50) {
      return "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)";
    } else if (aqi <= 100) {
      return "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
    } else if (aqi <= 150) {
      return "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)";
    } else if (aqi <= 200) {
      return "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)";
    } else {
      return "linear-gradient(135deg, #8b5a3c 0%, #6b4423 100%)";
    }
  };

  useEffect(() => {
    const t = setInterval(() => {
      setNowStr(moment().tz("America/Mexico_City").format("HH:mm"));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fetchLive = async () => {
    try {
      setError("");
      const res = await fetch("/api/sensors/latest");
      if (!res.ok) throw new Error("No se pudo consultar el endpoint en vivo");
      const data = await res.json();

      if (data && data.timestamp) {
        const ageMs = Date.now() - new Date(data.timestamp).getTime();
        const FIVE_MIN = 5 * 60 * 1000;
        const fresh = ageMs <= FIVE_MIN;
        setIsLive(fresh);
        setLiveData(fresh ? data : null);
      } else {
        setIsLive(false);
        setLiveData(null);
      }
    } catch (e) {
      setError(e.message || "Error inesperado");
      setIsLive(false);
      setLiveData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const intv = setInterval(fetchLive, 5000);
    return () => clearInterval(intv);
  }, []);

  const aqi = liveData?.AQI ?? liveData?.aqi ?? null;

  const shellStyle = {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%)",
    paddingTop: 48,
    paddingBottom: 32,
  };

  const heroStyle = {
    border: "none",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    background: getAQIGradient(aqi),
    color: "#fff",
    overflow: "hidden",
  };

  const patternStyle = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 50%)," +
      "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)," +
      "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.06) 0%, transparent 50%)",
    pointerEvents: "none",
  };

  return (
    <>
      <GuestNavbar />
      <div style={shellStyle}>
        <Container fluid className="px-3 px-md-4 py-5"  >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="fw-bold mb-1" style={{
                fontSize: "2.2rem",
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #1a1d29 0%, #495057 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Clairity — Modo visitante
              </h1>
              <p className="mb-0 text-muted">Visualiza datos en tiempo real sin registrarte.</p>
            </div>
          </div>

          {/* Hero: Real-time AQI */}
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="position-relative" style={heroStyle}>
                <div style={patternStyle} />
                <Card.Body className="p-4 p-md-5 position-relative" style={{ zIndex: 2 }}>
                  <div className="row align-items-center g-4">
                    <div className="col-md-8">
                      <p className="mb-2 opacity-90 fw-semibold" style={{ fontSize: "1.05rem" }}>
                        Calidad del Aire Actual
                      </p>
                      <div className="d-flex align-items-baseline flex-wrap gap-3">
                        <h2 className="display-3 fw-bold mb-0" style={{ lineHeight: 0.9 }}>
                          {loading ? "--" : aqi ?? "--"}
                        </h2>
                        <span className="badge bg-white bg-opacity-25 px-3 py-2 text-white fw-semibold border border-white border-opacity-25">
                          US AQI
                        </span>
                        {aqi != null && (
                          <span className={`badge ${getAQIStatus(aqi).className} bg-opacity-25 px-3 py-2 text-white fw-semibold border border-white border-opacity-25`}>
                            {getAQIStatus(aqi).label}
                          </span>
                        )}
                        <span className={`badge ${isLive ? "bg-success" : "bg-secondary"} bg-opacity-25 px-3 py-2 text-white fw-semibold border border-white border-opacity-25`}>
                          {isLive ? "● En vivo" : "Sin transmisión en vivo"}
                        </span>
                      </div>

                      <div className="d-flex gap-4 mt-4 flex-wrap">
                        <div>
                          <div className="small opacity-85">Ubicación</div>
                          <div className="fw-semibold">Santiago de Querétaro, Qro.</div>
                        </div>
                        <div>
                          <div className="small opacity-85">Hora local</div>
                          <div className="fw-semibold">{nowStr}</div>
                        </div>
                        {liveData?.temperature != null && (
                          <div>
                            <div className="small opacity-85">Temperatura</div>
                            <div className="fw-semibold">{liveData.temperature}°C</div>
                          </div>
                        )}
                      </div>

                      {!loading && !isLive && (
                        <p className="mt-3 mb-0 small opacity-90">
                          No hay datos en vivo en este momento. Vuelve pronto o crea una cuenta para más opciones.
                        </p>
                      )}
                      {error && (
                        <p className="mt-3 mb-0 small text-warning">{error}</p>
                      )}
                    </div>

                    <div className="col-md-4 d-flex justify-content-center">
                      <BsCloud size={132} className="opacity-75" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* CTA */}
          <Row>
            <Col xs={12}>
              <Card style={{
                border: "none",
                borderRadius: 20,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
              }}>
                <Card.Body className="p-4 p-md-5">
                  <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-4">
                    <div>
                      <h5 className="fw-bold mb-2">Desbloquea el potencial completo de Clairity</h5>
                      <p className="text-muted mb-3 mb-md-2">
                        Regístrate o inicia sesión para acceder a:
                      </p>
                      <ul className="mb-0 text-muted" style={{ lineHeight: 1.6 }}>
                        <li className="mb-1 d-flex align-items-center gap-2"><BsBellFill /> Alertas por correo</li>
                        <li className="mb-1 d-flex align-items-center gap-2"><BsFlag /> Recomendaciones personalizadas</li>
                        <li className="mb-1 d-flex align-items-center gap-2"><BsPeople /> Panel histórico y análisis</li>
                      </ul>
                    </div>
                    <div className="d-flex flex-wrap gap-3 ms-md-4">
                      <Button variant="primary" className="px-4 py-2 rounded-pill fw-semibold" onClick={() => navigate("/signup")}>
                        Crear cuenta
                      </Button>
                      <Button variant="outline-primary" className="px-4 py-2 rounded-pill fw-semibold" onClick={() => navigate("/login")}>
                        Iniciar sesión
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 small text-muted">
                    Modo visitante: solo se muestran datos en vivo. No se guardan preferencias en esta vista.
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default Visitor;
