import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Container, Row, Col, Button, Modal } from "react-bootstrap";
import { BsCloud, BsSun, BsBell, BsFlag, BsPlus, BsLock } from "react-icons/bs";
import moment from "moment-timezone";
import GuestNavbar from "../components/GuestNavbar";
import SensorMap from "../components/GoogleMap";
import "../Estilos/ClairityDashboard.css";

const Visitor = () => {
  const [sensorData, setSensorData] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment().tz("America/Mexico_City").format("HH:mm"));
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment().tz("America/Mexico_City").format("HH:mm"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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
  }, []);

  const handleRedirectLogin = () => {
    window.location.href = "/login";
  };

  const handleShowLoginModal = () => {
    setShowLoginModal(true);
  };

  return (
    <div className="d-flex flex-column" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px" }}>
      <div className="flex-grow-1 d-flex flex-column" style={{ overflow: "auto" }}>
        <div style={{ marginTop: "20px" }}></div>


        <GuestNavbar />

        <div className="alert alert-info mx-3 text-center">
          <BsLock className="me-2" />
          Sign in to leverage the full potential of Clairity
        </div>

        <div className="d-flex justify-content-center align-items-center text-center px-3">
          <h1 className="fw-bold" style={{ fontSize: "2.5rem", color: "#333" }}>
            Welcome to Clairity
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
                  <p className="fw-bold mb-1 text-white" style={{ fontSize: "1.2rem" }}>Current Air Quality:</p>
                  <h4 className="mb-2 text-dark fw-bold">{sensorData ? sensorData.AQI : "Loading..."}</h4>
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
                    onClick={handleShowLoginModal}
                  >
                    <BsLock size={16} color="#000" />
                  </Button>
                </div>
              </Card>
            </Col>

            <Col xs={12} md={6}>
              <p className="fw-bold mb-2 text-dark" style={{ fontSize: "1.2rem" }}>
                Last update {sensorData ? moment(sensorData.timestamp).fromNow() : "Loading..."}
              </p>
              <div className="bg-white p-3 rounded-4 shadow-sm">
                <SensorMap coordinates="20.5888, -100.3899" />
              </div>
            </Col>
          </Row>

          <Row className="mt-4 align-items-center p-3 shadow-sm rounded-4 bg-light gx-3 gy-3">
            <Col xs={12} md={2} className="d-flex flex-column align-items-center justify-content-center p-3 bg-white rounded-4 border">
              <p className="text-muted mb-1 fw-bold">Current Device:</p>
              <h5 className="mb-0 fw-bold">{sensorData ? sensorData.device_id : "Loading..."}</h5>
            </Col>

            <Col xs={12} md={10} className="p-3 bg-white rounded-4 border">
              <h5 className="text-center fw-bold">AI Prediction</h5>
              <div className="d-flex justify-content-center mt-2 flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="rounded-circle d-flex justify-content-center align-items-center"
                  style={{ width: "40px", height: "40px", padding: 0 }}
                  onClick={handleShowLoginModal}
                >
                  <BsLock size={16} color="#fff" />
                </Button>
                <p className="text-muted w-100 text-center mt-2">Sign in to access AI predictions</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Login Modal */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Feature Locked</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This feature is only available for registered users. Please sign in to access all Clairity features.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLoginModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRedirectLogin}
            style={{ backgroundColor: "#40C8FF", borderColor: "#40C8FF" }}
          >
            Sign In
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Visitor;