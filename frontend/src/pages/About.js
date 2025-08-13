import React from 'react';
import { useState, useEffect } from 'react';
import { MapPin, Users, Globe } from 'react-feather';
import NavbarComponent from "../components/NavbarComponent";
import Img from '../resources/CLAIRITYBLACKMONO.png';
import GuestNavbar from "../components/GuestNavbar";
import Footer from "../components/footer";
import LayoutWithSidebar from '../components/LayoutWithSidebar';
import { useNavigate } from 'react-router-dom';

const About = () => {
        const navigate = useNavigate();
       const [isAuthenticated, setIsAuthenticated] = useState(false);
          const [userType, setUserType] = useState(null);
          const [userId, setUserId] = useState(null);
          const [alertsEnabled, setAlertsEnabled] = useState(false);
          const [name, setName] = useState("");
  
         useEffect(() => {
           const token = localStorage.getItem("token");
           const user = JSON.parse(localStorage.getItem("user"));
       
           if (!token) {
                setIsAuthenticated(false);
           } else {
             if (user) setUserType(user.type);
             setUserId(user._id);
             setAlertsEnabled(user.alerts);
             setName(user.name);
             setIsAuthenticated(true);
           }
         }, [navigate]);

  // Enhanced styling objects
  const containerStyle = {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    background: 'linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  };

  const cardStyle = {
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
    border: 'none',
    overflow: 'hidden',
    position: 'relative'
  };

  const cardHoverStyle = {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.18)'
  };

  const heroSectionStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '24px',
    position: 'relative',
    overflow: 'hidden',
    margin: '2rem 0'
  };

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

  const iconContainerStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    transition: 'all 0.3s ease',
    position: 'relative'
  };

  return (
    <div style={containerStyle}>
      {/* Navbar */}
             {isAuthenticated ? <LayoutWithSidebar /> : <GuestNavbar />}


      <div className="flex-grow-1">
        <div className="container py-5" style={{ marginTop: '70px' }}>
          <div className="about-content">
            
            {/* Hero Section - Enhanced Team Introduction */}
            <div style={heroSectionStyle}>
              <div style={backgroundPattern}></div>
              <div className="row justify-content-center" style={{ position: 'relative', zIndex: 2 }}>
                <div className="col-12 text-center p-5">
                  <div className="mb-4">
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                      style={{
                        width: '100px',
                        height: '100px',
                        background: 'rgba(255,255,255,0.2)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <Users size={48} />
                    </div>
                  </div>
                  <h2 style={{ 
                    fontSize: '3rem', 
                    fontWeight: 'bold',
                    marginBottom: '1.5rem',
                    textShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    letterSpacing: '-0.02em'
                  }}>
                    Nuestro Equipo
                  </h2>
                  <p style={{ 
                    fontSize: '1.3rem', 
                    marginBottom: '2rem',
                    opacity: 0.9,
                    lineHeight: '1.6',
                    maxWidth: '800px',
                    margin: '0 auto'
                  }}>
                    Joshua Daniel Luna Jiménez, Cecilia Mendoza Arteaga, Thania Margoth Rodríguez Trejo.
                  </p>
                </div>
              </div>
            </div>

            {/* Project Section - Enhanced */}
            <div className="row align-items-center mb-5">
              {/* Left side: Enhanced Image */}
              <div className="col-12 col-md-6 mb-4 mb-md-0">
                <div 
                  className="image-container"
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    transition: 'all 0.4s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                  }}
                >
                  <img 
                    src={Img} 
                    alt="Proyecto Clairity"
                    style={{
                      width: '100%', 
                      height: 'auto', 
                      objectFit: 'cover',
                      display: 'block'
                    }} 
                  />
                </div>
              </div>

              {/* Right side: Enhanced Text */}
              <div className="col-12 col-md-6">
                <div className="ps-md-4">
                  <div className="mb-4">
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 mb-3" style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      borderRadius: '12px'
                    }}>
                      Proyecto Innovador
                    </span>
                    <h2 style={{ 
                      fontSize: '2.5rem', 
                      color: '#1a1d29', 
                      fontWeight: 'bold',
                      marginBottom: '1.5rem',
                      lineHeight: '1.2',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Proyecto Clairity
                    </h2>
                  </div>
                  <p style={{ 
                    fontSize: '1.2rem', 
                    color: '#555', 
                    lineHeight: '1.8', 
                    marginBottom: '2rem'
                  }}>
                    Clairity es una plataforma innovadora que ayuda a monitorear la calidad del aire en tiempo real, 
                    permitiendo a las personas tomar decisiones informadas para proteger su salud y el medio ambiente.
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success px-3 py-2" style={{ fontSize: '0.85rem' }}>
                      IoT
                    </span>
                    <span className="badge bg-info bg-opacity-10 text-info px-3 py-2" style={{ fontSize: '0.85rem' }}>
                      Tiempo Real
                    </span>
                    <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2" style={{ fontSize: '0.85rem' }}>
                      Análisis de Datos
                    </span>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2" style={{ fontSize: '0.85rem' }}>
                      Salud Pública
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Section - Enhanced */}
            <div className="row align-items-center mb-5">
              {/* Left side: Text */}
              <div className="col-12 col-md-6 order-md-1 order-2">
                <div className="pe-md-4">
                  <div className="mb-4">
                    <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 mb-3" style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      borderRadius: '12px'
                    }}>
                      Nuestra Misión
                    </span>
                    <h2 style={{ 
                      fontSize: '2.5rem', 
                      color: '#1a1d29', 
                      fontWeight: 'bold',
                      marginBottom: '1.5rem',
                      lineHeight: '1.2'
                    }}>
                      Innovación para el Futuro
                    </h2>
                  </div>
                  <p style={{ 
                    fontSize: '1.2rem', 
                    color: '#555', 
                    lineHeight: '1.8', 
                    marginBottom: '2rem'
                  }}>
                    Nuestra misión es ofrecer soluciones tecnológicas innovadoras que permitan monitorear y mejorar 
                    la calidad del aire, contribuyendo así a la salud pública y la sostenibilidad ambiental para 
                    las futuras generaciones.
                  </p>
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="text-center">
                        <h4 className="fw-bold text-primary mb-1">24/7</h4>
                        <p className="small text-muted mb-0">Monitoreo Continuo</p>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center">
                        <h4 className="fw-bold text-success mb-1">Real-time</h4>
                        <p className="small text-muted mb-0">Datos en Vivo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: Visual Element */}
              <div className="col-12 col-md-6 order-md-2 order-1 mb-4 mb-md-0">
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    height: '400px',
                    background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                    borderRadius: '20px',
                    border: '2px solid rgba(102, 126, 234, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={backgroundPattern}></div>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <Globe size={120} className="text-primary opacity-75" />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Beneficiaries Section */}
            <div className="mb-5">
              <div className="text-center mb-5">
                <span className="badge bg-primary bg-opacity-10 text-primary px-4 py-2 mb-3" style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '12px'
                }}>
                  Impacto Social
                </span>
                <h2 style={{ 
                  fontSize: '2.8rem', 
                  color: '#1a1d29', 
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Beneficiarios
                </h2>
                <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                  Nuestro proyecto impacta positivamente a diversos sectores de la sociedad
                </p>
              </div>
              
              <div className="row justify-content-center g-4">
                <div className="col-12 col-md-4">
                  <div 
                    className="card h-100 text-center border-0"
                    style={cardStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    }}
                  >
                    <div className="card-body p-4">
                      <div 
                        style={{
                          ...iconContainerStyle,
                          background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                          border: '2px solid rgba(102, 126, 234, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1) rotate(5deg)';
                          e.target.style.background = 'linear-gradient(135deg, #667eea30 0%, #764ba230 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1) rotate(0deg)';
                          e.target.style.background = 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)';
                        }}
                      >
                        <Users size={36} className="text-primary" />
                      </div>
                      <h4 className="fw-bold mb-3" style={{ color: '#1a1d29' }}>Ciudadanos</h4>
                      <p style={{ 
                        color: '#666', 
                        lineHeight: '1.6',
                        fontSize: '1rem'
                      }}>
                        Información en tiempo real sobre la calidad del aire para personas con enfermedades 
                        respiratorias y la población en general.
                      </p>
                      <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
                        <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1 small">
                          Salud Personal
                        </span>
                        <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1 small">
                          Prevención
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-4">
                  <div 
                    className="card h-100 text-center border-0"
                    style={cardStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    }}
                  >
                    <div className="card-body p-4">
                      <div 
                        style={{
                          ...iconContainerStyle,
                          background: 'linear-gradient(135deg, #dc354520 0%, #fd7e1420 100%)',
                          border: '2px solid rgba(220, 53, 69, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1) rotate(5deg)';
                          e.target.style.background = 'linear-gradient(135deg, #dc354530 0%, #fd7e1430 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1) rotate(0deg)';
                          e.target.style.background = 'linear-gradient(135deg, #dc354520 0%, #fd7e1420 100%)';
                        }}
                      >
                        <MapPin size={36} className="text-danger" />
                      </div>
                      <h4 className="fw-bold mb-3" style={{ color: '#1a1d29' }}>Autoridades</h4>
                      <p style={{ 
                        color: '#666', 
                        lineHeight: '1.6',
                        fontSize: '1rem'
                      }}>
                        Monitoreo constante para la creación de políticas públicas eficaces en la protección 
                        del medio ambiente y la salud ciudadana.
                      </p>
                      <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
                        <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 small">
                          Políticas Públicas
                        </span>
                        <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 small">
                          Regulación
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-4">
                  <div 
                    className="card h-100 text-center border-0"
                    style={cardStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    }}
                  >
                    <div className="card-body p-4">
                      <div 
                        style={{
                          ...iconContainerStyle,
                          background: 'linear-gradient(135deg, #28a74520 0%, #20c99720 100%)',
                          border: '2px solid rgba(40, 167, 69, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1) rotate(5deg)';
                          e.target.style.background = 'linear-gradient(135deg, #28a74530 0%, #20c99730 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1) rotate(0deg)';
                          e.target.style.background = 'linear-gradient(135deg, #28a74520 0%, #20c99720 100%)';
                        }}
                      >
                        <Globe size={36} className="text-success" />
                      </div>
                      <h4 className="fw-bold mb-3" style={{ color: '#1a1d29' }}>Organizaciones</h4>
                      <p style={{ 
                        color: '#666', 
                        lineHeight: '1.6',
                        fontSize: '1rem'
                      }}>
                        Datos valiosos para campañas de concientización sobre la importancia del aire limpio 
                        y la sostenibilidad ambiental.
                      </p>
                      <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
                        <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 small">
                          Sostenibilidad
                        </span>
                        <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 small">
                          Educación
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action Section */}
            <div 
              className="text-center py-5 mb-4"
              style={{
                background: 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}
            >
              <h3 className="fw-bold mb-3" style={{ color: '#1a1d29' }}>
                ¿Listo para monitorear la calidad del aire?
              </h3>
              <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                Únete a nuestra plataforma y contribuye a un futuro más limpio y saludable
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;