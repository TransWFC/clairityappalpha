// src/pages/Home.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Estilos/Home.css";
import logo from "../resources/CLAIRITYBLACKMONO.png";
import home from "../resources/home_people_image.png";
import bg from "../resources/Fondo.jpg";
import Footer from "../components/footer"; // Import the new Footer component

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  return (
    <div className="home-container" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <main className="home" style={{ flex: 1 }}>
        {/* Background image layer */}
        <div
          className="home__bg"
          style={{ backgroundImage: `url(${bg})` }}
          aria-hidden="true"
        />

        <div className="home__grid">
          <section className="home__content" aria-labelledby="home-title">
            <img src={logo} alt="Clairity" className="home__logo" height={56} />

            <h1 id="home-title" className="home__title">
              Respira con claridad.
            </h1>

            <p className="home__tagline">
              “En Clairity, transformamos datos en decisiones inteligentes
              para un aire más limpio y saludable.”
            </p>

            <div className="home__cta">
              <button
                className="home__btn home__btn--primary"
                onClick={() => navigate("/signup")}
              >
                Crear cuenta
              </button>

              <button
                className="home__btn home__btn--outline"
                onClick={() => navigate("/login")}
              >
                Iniciar sesión
              </button>

              <button
                className="home__btn home__btn--ghost"
                onClick={() => navigate("/visitor")}
              >
                Ingresar como visitante
              </button>

              <button
                className="home__btn home__btn--ghost"
                onClick={() => navigate("/about")}
              >
                About
              </button>
            </div>
          </section>

          <section className="home__visual" aria-hidden="true">
            <img src={home} alt="" className="home__image" loading="lazy" />
          </section>
        </div>
      </main>

      {/* Footer always at bottom */}
      <Footer />
    </div>
  );
}


export default Home;
