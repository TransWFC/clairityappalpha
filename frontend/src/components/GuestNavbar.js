// src/components/NavbarGuest.jsx
import React from "react";
import { Navbar, Container, Button } from "react-bootstrap";
import {
  BsHouseDoor,
  BsInfoCircle,
  BsStars,
  BsBoxArrowInRight,
  BsPersonPlus
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import Logo from "../resources/CLAIRITYBLACKMONO.png";

const GuestNavbar = () => {
  const navigate = useNavigate();

  const NavItem = ({ Icon, label, to }) => (
    <div
      role="button"
      className="d-flex align-items-center px-3 py-2 rounded-pill"
      style={{
        cursor: "pointer",
        transition: "all 0.3s ease",
        background: "transparent"
      }}
      onClick={() => navigate(to)}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(102, 126, 234, 0.1)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      aria-label={label}
    >
      <Icon size={16} className="me-2" style={{ color: "#667eea" }} />
      <span className="fw-semibold" style={{ color: "#1a1d29", fontSize: "0.95rem" }}>
        {label}
      </span>
    </div>
  );

  return (
    <Navbar
      className="shadow-sm"
      style={{
        backgroundColor: "white",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1030,
        borderBottom: "1px solid #e9ecef",
        backdropFilter: "blur(10px)",
        height: "70px"
      }}
    >
      <Container fluid className="d-flex justify-content-between align-items-center px-4">
        {/* Left: Logo */}
        <div className="d-flex align-items-center">
          <img
            src={Logo}
            alt="Clairity"
            style={{
              height: 40,
              width: "auto",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onClick={() => navigate("/")}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        </div>

        {/* Right: Auth CTAs */}
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-primary"
            className="rounded-pill px-3"
            onClick={() => navigate("/login")}
          >
            <BsBoxArrowInRight className="me-2" />
            Iniciar sesión
          </Button>

          <Button
            className="rounded-pill px-3"
            style={{
              border: "none",
              transition: "all 0.3s ease",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            onClick={() => navigate("/signup")}
          >
            <BsPersonPlus className="me-2" />
            Crear cuenta
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default GuestNavbar;
