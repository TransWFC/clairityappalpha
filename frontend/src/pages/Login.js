import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Estilos/Loginysign.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000); // El mensaje desaparece después de 5 segundos
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("${process.env.REACT_APP_BACKEND_API_URL}/api/auth/login", {
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
    } catch (err) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("${process.env.REACT_APP_BACKEND_API_URL}/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setMessage("Cuenta creada exitosamente. Ahora inicia sesión.");
      setIsSigningUp(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    try {
      const response = await fetch("${process.env.REACT_APP_BACKEND_API_URL}/api/auth/send-verification-code", {
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
      const response = await fetch("${process.env.REACT_APP_BACKEND_API_URL}/api/auth/reset-password", {
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
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">
          {isSigningUp ? "Crear Cuenta" : isResetting ? "Recuperar Contraseña" : "Iniciar Sesión"}
        </h2>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {loading && <div className="loading-spinner">Cargando...</div>}

        {!isResetting && !isSigningUp ? (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Contraseña"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-login" type="submit" disabled={loading}>Iniciar sesión</button>
          </form>
        ) : isResetting ? (
          <form onSubmit={handleResetPassword}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Tu correo"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="button"
              className="btn-login"
              onClick={handleSendVerificationCode}
              disabled={loading || countdown > 0}
            >
              {countdown > 0 ? `Reenviar código en ${countdown}s` : "Enviar Código"}
            </button>

            <div className="input-group">
              <input
                type="text"
                placeholder="Código de verificación"
                className="input-field"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Nueva contraseña"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-login" disabled={loading}>Restablecer Contraseña</button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Nombre"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Contraseña"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-login" disabled={loading}>Crear Cuenta</button>
          </form>
        )}

        {!isResetting && !isSigningUp ? (
          <>
            <p className="forgot-password-link" onClick={() => setIsResetting(true)}>
              ¿Olvidaste tu contraseña?
            </p>
            <p className="signup-link">
              <a href="/signup">¿No tienes cuenta? Crea tu cuenta aquí</a>
            </p>
          </>
        ) : isResetting ? (
          <p className="forgot-password-link" onClick={() => setIsResetting(false)}>
            Volver al inicio de sesión
          </p>
        ) : (
          <p className="signup-link" onClick={() => setIsSigningUp(false)}>
            Volver al inicio de sesión
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
