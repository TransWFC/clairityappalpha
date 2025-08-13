import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { BsHeart, BsGithub, BsLinkedin, BsEnvelope, BsGlobe } from 'react-icons/bs';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    zIndex: 10
  };

  const linkStyle = {
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const socialIconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.2)'
  };

  return (
    <footer style={footerStyle}>
      <Container>
        <Row className="py-4 align-items-center">
          <Col md={4} className="mb-3 mb-md-0">
<div className="d-flex align-items-center mb-2">
  <img
    src={require("../resources/CLAIRITYWHITEMONO.png")}
    alt="Clairity Logo"
    style={{
      height: "32px",
      width: "auto",
      objectFit: "contain",
      filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.2))"
    }}
  />
</div>
            <p className="mb-0" style={{ 
              fontSize: '0.875rem', 
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.5'
            }}>
              Monitoreo inteligente de calidad del aire para un futuro más limpio.
            </p>
          </Col>

          {/* Team Info */}
          <Col md={4} className="mb-3 mb-md-0 text-center">
            <h6 className="fw-semibold mb-2" style={{ fontSize: '0.875rem' }}>
              Desarrollado por
            </h6>
            <p className="mb-0" style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.4'
            }}>
              Joshua Luna, Cecilia Mendoza, Thania Rodríguez
            </p>
          </Col>

          {/* Social Links and Copyright */}
          <Col md={4} className="text-md-end">
<div className="d-flex justify-content-md-end justify-content-center gap-2 mb-2">
  <a
    href="https://github.com/TransWFC/clairityappalpha" // Replace with your real GitHub repo/profile
    target="_blank"
    rel="noopener noreferrer"
    style={{
      ...socialIconStyle,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      color: "inherit"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <BsGithub size={16} />
  </a>
</div>
            <p className="mb-0" style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255,255,255,0.6)'
            }}>
              © {currentYear} Clairity. Hecho con <BsHeart size={12} className="mx-1" style={{ color: '#ff6b9d' }} /> en México
            </p>
          </Col>
        </Row>

        {/* Divider */}
        <div 
          style={{ 
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            margin: '0 -15px'
          }}
        />

        {/* Bottom Row */}
        <Row className="py-3">
          <Col className="text-center">
            <div className="d-flex flex-wrap justify-content-center gap-4">
              <a 
                href="/privacy" 
                style={linkStyle}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >
                Política de Privacidad / Términos de Uso
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;