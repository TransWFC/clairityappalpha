import React from 'react';
import { MapPin, Users, Globe } from 'react-feather'; // Iconos
import NavbarComponent from "../components/NavbarComponent"; // Asegúrate de que la ruta es correcta
import Img from '../resources/CLAIRITYBLACK.png'; // Asegúrate de que la ruta sea correcta

const About = () => {
  return (
    <>
      {/* Navbar */}
      <NavbarComponent handleLogout={() => console.log("Cerrar sesión")} />

      <div className="container py-5" style={{ marginTop: '70px' }}>
        <div className="about-content">
          {/* Descripción de los integrantes del equipo */}
          <div className="row justify-content-center mb-5">
            <div className="col-12 col-md-6 text-center">
              <h3 style={{ fontSize: '28px', color: '#40C8FF', fontWeight: 'bold' }}>
                Nuestro Equipo
              </h3>
              <p style={{ fontSize: '16px', color: '#555', marginTop: '20px' }}>
                Joshua Daniel Luna Jiménez, Cecilia Mendoza Arteaga, Thania Margoth Rodríguez Trejo, Damián Yael Aguilera Gutiérrez y Alan Emanuel Rodríguez Miguel.
              </p>
            </div>
          </div>

          {/* Sección del Proyecto */}
          <div className="about-section text-center mb-5" style={{ backgroundColor: '#F7F9FC', padding: '50px 0' }}>
            <h2 style={{ fontSize: '32px', color: '#40C8FF', fontWeight: 'bold' }}>
              Proyecto Clairity
            </h2>
            <p style={{ fontSize: '18px', color: '#555', marginTop: '20px', lineHeight: '1.6' }}>
              Clairity es una plataforma que ayuda a monitorear la calidad del aire y permite a las personas tomar decisiones informadas para proteger su salud y el medio ambiente.
            </p>
          </div>

          {/* Sección con imagen y texto invertido */}
          <div className="row align-items-center mb-5">
            {/* Lado izquierdo: Imagen */}
            <div className="col-12 col-md-6 mb-4 mb-md-0">
              <div className="image-container">
                <img 
                  src={Img} 
                  alt="Proyecto Clairity"
                  style={{
                    width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 6px 12px rgba(199, 190, 190, 0.71)',
                  }} 
                />
              </div>
            </div>

            {/* Lado derecho: Texto */}
            <div className="col-12 col-md-6">
              <h3 style={{ fontSize: '28px', color: '#40C8FF', fontWeight: 'bold' }}>
                Nuestra Misión
              </h3>
              <p style={{ fontSize: '18px', color: '#555', lineHeight: '1.8', marginTop: '20px' }}>
                Nuestra misión es ofrecer soluciones innovadoras que permitan monitorear y mejorar la calidad del aire, contribuyendo así a la salud pública y la sostenibilidad ambiental.
              </p>
            </div>
          </div>

          {/* Beneficiarios - Distribución horizontal */}
          <div className="about-section text-center mb-5">
            <h2 style={{ fontSize: '32px', color: '#40C8FF', fontWeight: 'bold' }}>
              Beneficiarios
            </h2>
            <div className="row justify-content-center g-4" style={{ marginTop: '40px' }}>
              <div className="col-12 col-md-4">
                <div className="card p-4 shadow-sm border-0 text-center" style={{ borderRadius: '12px' }}>
                  <Users size={50} className="mb-3 text-primary" />
                  <h4 className="fw-bold">Ciudadanos</h4>
                  <p>Información en tiempo real sobre la calidad del aire para quienes padecen enfermedades respiratorias.</p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card p-4 shadow-sm border-0 text-center" style={{ borderRadius: '12px' }}>
                  <MapPin size={50} className="mb-3 text-danger" />
                  <h4 className="fw-bold">Autoridades</h4>
                  <p>Monitoreo constante para la creación de políticas públicas eficaces en la protección del medio ambiente.</p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card p-4 shadow-sm border-0 text-center" style={{ borderRadius: '12px' }}>
                  <Globe size={50} className="mb-3 text-success" />
                  <h4 className="fw-bold">Organizaciones</h4>
                  <p>Datos valiosos para campañas de concientización sobre la importancia del aire limpio y la sostenibilidad.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default About;
