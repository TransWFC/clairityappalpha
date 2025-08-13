import React from 'react';
import { useState, useEffect } from 'react';
import { Shield, FileText, Lock, Cookie, AlertCircle, Mail, Globe, User } from 'react-feather';
import GuestNavbar from "../components/GuestNavbar";
import Footer from "../components/footer";
import LayoutWithSidebar from '../components/LayoutWithSidebar';
import { useNavigate } from 'react-router-dom';

const PrivacyTerms = () => {
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
    
  // Reuse the same visual language/styles from About.jsx
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

  const SectionCard = ({ icon, title, children, accent = '#667eea', iconClassName }) => (
    <div
      className="card border-0 h-100"
      style={{ ...cardStyle }}
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
            background: `linear-gradient(135deg, ${accent}20 0%, ${accent}10 100%)`,
            border: `2px solid ${accent}30`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
        >
          {icon}
        </div>
        <h4 className="fw-bold mb-3" style={{ color: '#1a1d29' }}>{title}</h4>
        <div style={{ color: '#555', lineHeight: 1.8, fontSize: '1rem' }}>{children}</div>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
       {isAuthenticated ? <LayoutWithSidebar /> : <GuestNavbar />}

      <div className="flex-grow-1">
        <div className="container py-5" style={{ marginTop: '70px' }}>
          {/* Hero */}
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
                    <Shield size={48} />
                  </div>
                </div>
                <h2
                  style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    textShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Privacidad & Términos de Uso
                </h2>
                <p style={{ fontSize: '1.05rem', opacity: 0.95, marginBottom: 0 }}>
                  Última actualización: 13 de agosto de 2025 — Esta página ofrece un resumen claro. No sustituye asesoría legal.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="row justify-content-center mb-4">
            <div className="col-12 col-lg-10">
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <a className="badge bg-primary bg-opacity-10 text-primary px-3 py-2" href="#privacidad">Política de Privacidad</a>
                <a className="badge bg-success bg-opacity-10 text-success px-3 py-2" href="#terminos">Términos de Uso</a>
                <a className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2" href="#contacto">Contacto</a>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Main Content */}
            <div className="col-12 col-lg-8">
              {/* Privacy Policy */}
              <div id="privacidad" className="mb-4">
                <SectionCard
                  title="Política de Privacidad"
                  accent="#667eea"
                  icon={<Lock size={36} className="text-primary" />}
                >
                  <p>
                    En Clairity valoramos tu privacidad. Esta Política explica qué datos recopilamos, cómo los usamos y qué
                    derechos tienes. Al usar la plataforma, aceptas estas prácticas.
                  </p>

                  <h6 className="fw-bold mt-4">1) Datos que recopilamos</h6>
                  <ul className="mt-2 mb-3">
                    <li><strong>Cuenta:</strong> nombre, email y credenciales cifradas.</li>
                    <li><strong>Uso de la app:</strong> interacciones básicas para mejorar la experiencia.</li>
                    <li><strong>Datos ambientales:</strong> lecturas de sensores de calidad del aire y metadatos técnicos.</li>
                    <li><strong>Datos técnicos:</strong> dirección IP aproximada, tipo de dispositivo/navegador, logs y cookies.
                      Si habilitas geolocalización, podremos recibir ubicación aproximada para mapas.</li>
                  </ul>

                  <h6 className="fw-bold">2) Cómo usamos los datos</h6>
                  <ul className="mt-2 mb-3">
                    <li>Proveer y mantener la plataforma (monitoreo en tiempo real, alertas, paneles).</li>
                    <li>Mejorar rendimiento, seguridad y soporte.</li>
                    <li>Enviar comunicaciones esenciales del servicio (no spam) y, si lo aceptas, novedades.</li>
                    <li>Cumplir obligaciones legales y prevenir fraude/abuso.</li>
                  </ul>

                  <h6 className="fw-bold">3) Base legal</h6>
                  <p>
                    Operamos bajo bases como <em>consentimiento</em>, <em>ejecución de contrato</em> e <em>interés legítimo</em>, según corresponda.
                  </p>

                  <h6 className="fw-bold">4) Compartición</h6>
                  <p>
                    No vendemos tus datos. Podemos compartir con proveedores (alojamiento, analítica) bajo contratos de
                    confidencialidad, o cuando la ley lo exija.
                  </p>

                  <h6 className="fw-bold">5) Retención</h6>
                  <p>
                    Conservamos los datos el tiempo necesario para los fines descritos o lo exigido por ley. Puedes solicitar
                    eliminación de cuenta cuando quieras.
                  </p>

                  <h6 className="fw-bold">6) Tus derechos</h6>
                  <ul className="mt-2 mb-3">
                    <li>Acceso, rectificación, eliminación.</li>
                    <li>Oposición o limitación al procesamiento.</li>
                    <li>Portabilidad y retiro del consentimiento.</li>
                  </ul>

                  <h6 className="fw-bold">7) Cookies</h6>
                  <p>
                    Usamos cookies esenciales para sesión y seguridad, y opcionales para analítica (solo con tu consentimiento).
                    Puedes gestionar preferencias en tu navegador.
                  </p>

                  <h6 className="fw-bold">8) Seguridad</h6>
                  <p>
                    Aplicamos medidas razonables (cifrado en tránsito, controles de acceso). Ningún sistema es 100% infalible.
                  </p>

                  <h6 className="fw-bold">9) Menores</h6>
                  <p>
                    La plataforma no está dirigida a menores de 13 años. Si detectamos uso indebido, eliminaremos la cuenta.
                  </p>

                  <h6 className="fw-bold">10) Cambios a esta Política</h6>
                  <p>
                    Publicaremos actualizaciones en esta página e indicaremos la fecha de la última revisión.
                  </p>
                </SectionCard>
              </div>

              {/* Terms of Use */}
              <div id="terminos" className="mb-4">
                <SectionCard
                  title="Términos de Uso"
                  accent="#20c997"
                  icon={<FileText size={36} className="text-success" />}
                >
                  <h6 className="fw-bold">1) Aceptación</h6>
                  <p>
                    Al acceder o usar Clairity aceptas estos Términos. Si no estás de acuerdo, no utilices el servicio.
                  </p>

                  <h6 className="fw-bold">2) Uso permitido</h6>
                  <ul className="mt-2 mb-3">
                    <li>Usar la app conforme a la ley y a estos Términos.</li>
                    <li>No interferir con el servicio ni intentar acceder a áreas no autorizadas.</li>
                    <li>No usar datos de Clairity para actividades ilícitas o perjudiciales.</li>
                  </ul>

                  <h6 className="fw-bold">3) Cuenta y seguridad</h6>
                  <p>
                    Eres responsable de tu cuenta y de mantener tu contraseña segura. Notifícanos ante uso no autorizado.
                  </p>

                  <h6 className="fw-bold">4) Propiedad intelectual</h6>
                  <p>
                    Clairity y sus contenidos están protegidos por derechos de autor y otras leyes. No puedes copiar,
                    modificar ni distribuir sin permiso.
                  </p>

                  <h6 className="fw-bold">5) Contenido del usuario</h6>
                  <p>
                    Al aportar contenido, garantizas que tienes derechos para usarlo y nos concedes una licencia limitada
                    para operar el servicio.
                  </p>

                  <h6 className="fw-bold">6) Limitación de responsabilidad</h6>
                  <p>
                    En la medida permitida por la ley, Clairity no será responsable por daños indirectos o pérdida de datos
                    derivada del uso del servicio.
                  </p>

                  <h6 className="fw-bold">7) Terminación</h6>
                  <p>
                    Podemos suspender o cerrar cuentas que incumplan estos Términos. Puedes dejar de usar el servicio en
                    cualquier momento y solicitar eliminación de tu cuenta.
                  </p>

                  <h6 className="fw-bold">8) Ley aplicable</h6>
                  <p>
                    Estas condiciones se rigen por las leyes de México. Si operas en otra jurisdicción, ajusta este apartado.
                  </p>

                  <h6 className="fw-bold">9) Cambios a los Términos</h6>
                  <p>
                    Podemos actualizar estos Términos. Publicaremos la fecha de revisión y, si el cambio es sustancial,
                    procuraremos avisarte por medios razonables.
                  </p>
                </SectionCard>
              </div>

              {/* Contact */}
              <div id="contacto" className="mb-4">
                <SectionCard
                  title="Contacto"
                  accent="#fd7e14"
                  icon={<Mail size={36} className="text-warning" />}
                >
                  <p className="mb-2">¿Dudas sobre privacidad o Términos? Escríbenos:</p>
                  <ul className="mb-0">
                    <li>Email de soporte: <a href="mailto:soporte@clairity.app">clairityapp@gmail.com</a></li>
                  </ul>
                </SectionCard>
              </div>
            </div>

            {/* Side Panel */}
            <div className="col-12 col-lg-4">
              <div className="mb-4">
                <SectionCard
                  title="Resumen rápido"
                  accent="#6f42c1"
                  icon={<AlertCircle size={36} className="text-secondary" />}
                >
                  <ul className="mb-0">
                    <li>No vendemos tus datos.</li>
                    <li>Puedes solicitar eliminación de tu cuenta.</li>
                    <li>Cookies esenciales y opcionales (con consentimiento).</li>
                    <li>Actualizaremos esta página ante cambios relevantes.</li>
                  </ul>
                </SectionCard>
              </div>

              <div className="mb-4">
                <SectionCard
                  title="Tu control"
                  accent="#0d6efd"
                  icon={<User size={36} className="text-primary" />}
                >
                  <ul className="mb-0">
                    <li>Revisa tu perfil para gestionar datos básicos.</li>
                    <li>Configura alertas y preferencias cuando estén disponibles.</li>
                    <li>Escríbenos para ejercer derechos ARCO/GPDR equivalentes.</li>
                  </ul>
                </SectionCard>
              </div>

              <div>
                <SectionCard
                  title="Ubicaciones y datos ambientales"
                  accent="#198754"
                  icon={<Globe size={36} className="text-success" />}
                >
                  <p className="mb-0">
                    Si habilitas mapas o geolocalización, usaremos ubicación aproximada para mostrar datos ambientales
                    cercanos. Puedes desactivarlo en cualquier momento.
                  </p>
                </SectionCard>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div
            className="text-center py-5 my-4"
            style={{
              background: 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(102, 126, 234, 0.1)'
            }}
          >
            <h3 className="fw-bold mb-2" style={{ color: '#1a1d29' }}>Tu privacidad es primero</h3>
            <p className="text-muted mb-0" style={{ fontSize: '1.05rem' }}>
              En Clairity trabajamos para ofrecer transparencia y control sobre tus datos.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyTerms;
