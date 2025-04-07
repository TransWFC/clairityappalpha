import React from "react";
import { Navbar, Container, Button } from "react-bootstrap";
import Logo from "../resources/CLAIRITYWHITEMONO.png";
import { useNavigate } from "react-router-dom";

const GuestNavbar = () => {
  const navigate = useNavigate();

  return (
    <Navbar
      className="text-white p-3 shadow-sm w-100"
      style={{
        backgroundColor: "#40C8FF",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        zIndex: 1000,
      }}
    >
      <Container fluid className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <img 
            src={Logo} 
            alt="Clairity" 
            style={{ height: 40, width: "auto", cursor: "pointer" }} 
            onClick={() => navigate("/")} 
          />
        </div>
        <Button 
          variant="light" 
          className="fw-bold"
            style={{borderRadius: "60px" }} 
          onClick={() => navigate("/login")}
        >
          Sign In
        </Button>
      </Container>
    </Navbar>
  );
};

export default GuestNavbar;
