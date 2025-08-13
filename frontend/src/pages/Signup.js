// src/pages/SignupPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BsHouseFill } from "react-icons/bs";
import "../Estilos/Loginysign.css";
import logoBlack from "../resources/CLAIRITYBLACK.png";
import bg from "../resources/Fondo.jpg";
import Footer from "../components/footer"; // 👈 igual que en Home

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "", verificationCode: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let t;
    if (countdown > 0) t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!isCodeSent) {
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden");
        setIsLoading(false);
        return;
      }
      if (!validatePassword(formData.password)) {
        setError("La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/auth/send-verification-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email })
        });
        const data = await response.json();
        if (response.ok) {
          setIsCodeSent(true);
          setMessage("Código enviado. Revisa tu correo.");
          setCountdown(30);
          setTimeout(() => setMessage(""), 5000);
        } else {
          setError(data.message);
        }
      } catch {
        setError("Error al conectar con el servidor");
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            verificationCode: formData.verificationCode
          })
        });
        const data = await response.json();
        if (response.ok) {
          setMessage("Cuenta creada exitosamente. Ahora inicia sesión.");
          setTimeout(() => navigate("/login"), 5000);
        } else {
          setError(data.message);
        }
      } catch {
        setError("Error al registrar el usuario");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendVerificationCode = async () => {
    if (countdown > 0) return;
    try {
      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Código reenviado. Revisa tu correo.");
        setCountdown(30);
        setTimeout(() => setMessage(""), 5000);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Error al conectar con el servidor");
    }
  };

  return (
    <div
      className="auth-page-container"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }} // 👈 igual que Home
    >
      <main className="auth auth--light" style={{ flex: 1 }}>
        {/* Background image layer */}
        <div
          className="auth__bg"
          style={{ backgroundImage: `url(${bg})` }}
          aria-hidden="true"
        />

        {/* Home Button */}
        <Link to="/" className="auth__homebtn" aria-label="Ir al inicio">
          <BsHouseFill size={20} />
        </Link>

        <section className="auth__card">
          <img src={logoBlack} alt="Clairity" className="auth__logo" />
          <h2 className="auth__title">Registro</h2>

          {error && <p className="auth__alert auth__alert--error">{error}</p>}
          {message && <p className="auth__alert auth__alert--success">{message}</p>}

          <form onSubmit={handleSubmit} className="auth__form">
            {!isCodeSent ? (
              <>
                <div className="auth__group">
                  <input
                    type="text"
                    name="name"
                    placeholder="Nombre"
                    className="auth__input"
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="auth__group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="auth__input"
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="auth__group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    className="auth__input"
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="auth__group">
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirmar contraseña"
                    className="auth__input"
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="auth__group">
                  <input
                    type="text"
                    name="verificationCode"
                    placeholder="Código de verificación"
                    className="auth__input"
                    onChange={handleChange}
                    required
                    inputMode="numeric"
                  />
                </div>

                <button
                  type="button"
                  className="auth__btn auth__btn--outline"
                  onClick={handleResendVerificationCode}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `Reenviar código en ${countdown}s` : "Reenviar código"}
                </button>
              </>
            )}

            <button type="submit" className="auth__btn auth__btn--primary" disabled={isLoading}>
              {isLoading ? "Cargando..." : isCodeSent ? "Verificar código" : "Registrarse"}
            </button>
          </form>

          <p className="auth__muted">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="auth__anchor">
              Iniciar sesión
            </Link>
          </p>
        </section>
      </main>

      {/* Footer al final (no sticky) */}
      <Footer />
    </div>
  );
};

export default SignupPage;
