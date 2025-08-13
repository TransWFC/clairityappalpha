// src/pages/LoginPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BsHouseFill } from "react-icons/bs";
import "../Estilos/Loginysign.css";
import logoBlack from "../resources/CLAIRITYBLACK.png";
import bg from "../resources/Fondo.jpg";
import Footer from "../components/footer"; // 👈 igual que en Home

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.message === "Ya hay una sesión activa para este usuario") {
          setError("Ya hay una sesión activa para este usuario. Por favor, cierra la sesión desde otro lugar.");
        } else {
          setError(data.message || "Error al iniciar sesión");
        }
        throw new Error(data.message || "Error al iniciar sesión");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch {
      // manejado arriba
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage("Código enviado. Revisa tu correo.");
      setCountdown(30);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage("Contraseña cambiada exitosamente. Ahora inicia sesión.");
      setIsResetting(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page-container"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }} // 👈 igual que en Home
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
          <h2 className="auth__title">{isResetting ? "Recuperar Contraseña" : "Iniciar Sesión"}</h2>

          {error && <p className="auth__alert auth__alert--error">{error}</p>}
          {message && <p className="auth__alert auth__alert--success">{message}</p>}
          {loading && <div className="auth__spinner">Cargando…</div>}

          {!isResetting ? (
            <form onSubmit={handleLogin} className="auth__form">
              <div className="auth__group">
                <input
                  type="email"
                  placeholder="Email"
                  className="auth__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth__group">
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="auth__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button className="auth__btn auth__btn--primary" type="submit" disabled={loading}>
                Iniciar sesión
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="auth__form">
              <div className="auth__group">
                <input
                  type="email"
                  placeholder="Tu correo"
                  className="auth__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="button"
                className="auth__btn auth__btn--outline"
                onClick={handleSendVerificationCode}
                disabled={loading || countdown > 0}
              >
                {countdown > 0 ? `Reenviar código en ${countdown}s` : "Enviar Código"}
              </button>

              <div className="auth__group">
                <input
                  type="text"
                  placeholder="Código de verificación"
                  className="auth__input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  inputMode="numeric"
                />
              </div>
              <div className="auth__group">
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  className="auth__input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <button className="auth__btn auth__btn--primary" disabled={loading}>
                Restablecer Contraseña
              </button>
            </form>
          )}

          {!isResetting ? (
            <>
              <button className="auth__link" onClick={() => setIsResetting(true)}>
                ¿Olvidaste tu contraseña?
              </button>
              <p className="auth__muted">
                ¿No tienes cuenta?{" "}
                <Link to="/signup" className="auth__anchor">
                  Crea tu cuenta aquí
                </Link>
              </p>
            </>
          ) : (
            <button className="auth__link" onClick={() => setIsResetting(false)}>
              Volver al inicio de sesión
            </button>
          )}
        </section>
      </main>

      {/* Footer al final (no sticky) */}
      <Footer />
    </div>
  );
};

export default LoginPage;
