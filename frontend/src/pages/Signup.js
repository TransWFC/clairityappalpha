import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BsHouseFill } from "react-icons/bs";
import "../index.css"; // Asegúrate de que los estilos estén importados

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // Mensaje de éxito
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // Contador para el reenvío del código

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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

    if (!isCodeSent) {
      // Enviar el código de verificación
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
          setCountdown(30); // Iniciar el contador de 30 segundos
          setError(""); // Limpiar cualquier error previo

          // Borrar el mensaje después de 5 segundos
          setTimeout(() => setMessage(""), 5000);
        } else {
          setError(data.message); // Mostrar error si la respuesta no es OK
        }
      } catch (err) {
        setError("Error al conectar con el servidor");
      }
    } else {
      // Registrar el usuario y verificar el código
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
          setTimeout(() => navigate("/login"), 5000); // Redirigir después de 5 segundos
        } else {
          setError(data.message); // Mostrar el mensaje de error si ocurre
        }
      } catch (err) {
        setError("Error al registrar el usuario");
      }
    }

    setIsLoading(false);
  };

  const handleResendVerificationCode = async () => {
    if (countdown === 0) {
      try {
        const response = await fetch("/api/auth/send-verification-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email })
        });

        const data = await response.json();
        if (response.ok) {
          setMessage("Código reenviado. Revisa tu correo.");
          setCountdown(30); // Reiniciar el contador de 30 segundos

          // Borrar el mensaje después de 5 segundos
          setTimeout(() => setMessage(""), 5000);
        } else {
          setError(data.message); // Mostrar error si la respuesta no es OK
        }
      } catch (err) {
        setError("Error al conectar con el servidor");
      }
    }
  };

  return (
    <div className="login-container">
      {/* Home Button */}
      <Link 
        to="/" 
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "#40C8FF",
          backgroundColor: "white",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          zIndex: 10
        }}
      >
        <BsHouseFill size={20} />
      </Link>
      
      <div className="login-box">
        <h2 className="login-title">Registro</h2>
        
        {/* Mostrar mensaje de error o éxito */}
        {error && <p className="error">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          {!isCodeSent ? (
            <>
              <div className="input-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Nombre"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="input-group">
                <input
                  type="text"
                  name="verificationCode"
                  placeholder="Código de verificación"
                  className="input-field"
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="button"
                className="btn-login"
                onClick={handleResendVerificationCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Reenviar código en ${countdown}s` : "Reenviar código"}
              </button>
            </>
          )}

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? "Cargando..." : isCodeSent ? "Verificar código" : "Registrarse"}
          </button>
        </form>

        <p className="signup-link" onClick={() => navigate("/login")}>
          ¿Ya tienes cuenta? Iniciar sesión
        </p>
      </div>
    </div>
  );
};

export default SignupPage;