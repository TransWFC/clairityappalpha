import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavbarComponent from "../components/NavbarComponent";
import SidebarComponent from "../components/SidebarComponent";
import { BsBell, BsFlag } from "react-icons/bs";

const Evolucion = () => {
  const navigate = useNavigate();
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("mexico");
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [name, setName] = useState("");

  // Session validation - similar to ClarityDashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token) {
      navigate("/login");
    } else {
      if (user) setUserType(user.type);
      setUserId(user._id); // o user.id según tu backend
      setAlertsEnabled(user.alerts); // inicializa el estado de alertas
      setName(user.name); // inicializa el estado del nombre
      setIsAuthenticated(true);
    }
  }, [navigate]);

  // Fetch data only if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const response = await axios.get("pythonapi/api/calidad-aire");
          setCityData(response.data);
        } catch (err) {
          console.error("Error fetching data:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleAlerts = async () => {
    try {
      const newValue = !alertsEnabled;
      const res = await fetch(`/api /users/${userId}/toggle-alerts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },        
        body: JSON.stringify({ alertsEnabled: newValue }),
      });

      if (res.ok) {
        setAlertsEnabled(newValue);
        // Actualizar el usuario guardado localmente
        const updatedUser = { ...JSON.parse(localStorage.getItem("user")), alertsEnabled: newValue };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        console.error("Error al actualizar las alertas");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };

  // Preparar los datos para los gráficos
  const prepareChartData = () => {
    if (!cityData || !cityData[selectedCity]) return [];

    const currentCity = cityData[selectedCity];
    const chartData = [];

    if (currentCity.history) {
      currentCity.history.forEach(item => {
        chartData.push({
          fecha: format(parseISO(item.date), "HH:mm"),
          pm25: item.pm25,
          tipo: "Histórico"
        });
      });
    }

    if (currentCity.current) {
      chartData.push({
        fecha: "Actual",
        pm25: currentCity.current.value,
        tipo: "Actual"
      });
    }

    if (currentCity.forecast && currentCity.forecast.dates) {
      currentCity.forecast.dates.forEach((date, index) => {
        chartData.push({
          fecha: format(parseISO(date), "dd/MM HH:mm"),
          pm25: currentCity.forecast.combined[index],
          tipo: "Pronóstico"
        });
      });
    }

    return chartData;
  };

  // Datos de barras por día (tomando solo los primeros 30 días de predicción)
  const prepareBarChartData = () => {
    if (!cityData || !cityData[selectedCity]) return [];

    const currentCity = cityData[selectedCity];
    const barData = [];
    const maxDays = 30;  // Limitar a los primeros 30 días

    if (currentCity.forecast && currentCity.forecast.dates) {
      currentCity.forecast.dates.slice(0, maxDays).forEach((date, index) => {
        barData.push({
          fecha: format(parseISO(date), "dd/MM"),
          actual: currentCity.current.value,
          prediction: currentCity.forecast.combined[index]
        });
      });
    }
    return barData;
  };

  if (!isAuthenticated) {
    return null; // No renderizar nada hasta que se verifique la autenticación
  }

  if (loading) return (
    <div className="d-flex vh-100" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px", overflow: "hidden" }}>
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}
      <div className="flex-grow-1 d-flex flex-column h-100" 
        style={{ overflow: "hidden", marginLeft: userType === "admin" ? "250px" : "0" }}>
        <NavbarComponent handleLogout={handleLogout} />
        <div className="loading">Cargando datos...</div>
      </div>
    </div>
  );

  if (!cityData || !cityData[selectedCity]) return (
    <div className="d-flex vh-100" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px", overflow: "hidden" }}>
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}
      <div className="flex-grow-1 d-flex flex-column h-100" 
        style={{ overflow: "hidden", marginLeft: userType === "admin" ? "250px" : "0" }}>
        <NavbarComponent handleLogout={handleLogout} />
        <div className="container mt-5">No hay datos disponibles</div>
      </div>
    </div>
  );

  const chartData = prepareChartData();
  const barChartData = prepareBarChartData();

  return (
    <div className="d-flex vh-100" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px", overflow: "auto" }}>
      {/* Sidebar solo para admin */}
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}
      
      {/* Contenido principal */}
      <div className="flex-grow-1 d-flex flex-column h-100" 
        style={{ overflow: "auto", marginLeft: userType === "admin" ? "250px" : "0" }}>
        {/* Navbar fija */}
        <NavbarComponent handleLogout={handleLogout} />
        
        {/* Iconos fuera del Navbar */}
        <div className="d-flex justify-content-end gap-3 p-3">
          <BsBell
            size={20}
            className={alertsEnabled ? "text-primary" : "text-secondary"}
            style={{ cursor: "pointer" }}
            onClick={toggleAlerts}
          />
          <BsFlag size={20} className="text-dark" />
        </div>
        
        {/* Contenido de Evolución */}
        <div className="container py-4">
          <h1 className="text-center mb-4 fw-bold">Gráficas de Evolución del Aire</h1>
          <p className="text-center text-muted">{format(new Date(), "EEEE dd MMMM yyyy HH:mm", { locale: es })}</p>
          
          {/* Selector de ciudad */}
          <div className="mb-4 text-center">
            <label htmlFor="ciudad" className="me-2">Selecciona una ciudad: </label>
            <select 
              id="ciudad"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="form-select d-inline-block w-auto"
            >
              {Object.keys(cityData).map(city => (
                <option key={city} value={city}>
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </option>
              ))}
            </select>
            
            <button 
              className="btn btn-primary ms-3"
              onClick={() => navigate("/ai")}
            >
              Volver a Predicción
            </button>
          </div>

          {/* Gráfico de Dispersión */}
          <div className="bg-light p-4 rounded-4 shadow-lg mb-5">
            <h2 className="text-center mb-4">Dispersión de PM2.5 a lo largo del tiempo</h2>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" name="Hora" angle={-45} textAnchor="end" height={60} />
                <YAxis dataKey="pm25" name="PM2.5" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Legend />
                <Scatter name="PM2.5" data={chartData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Barras */}
          <div className="bg-light p-4 rounded-4 shadow-lg mb-5">
            <h2 className="text-center mb-4">PM2.5 por Día (Actual vs Predicción)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual" name="Actual" fill="#009966" />
                <Bar dataKey="prediction" name="Predicción" fill="#ff9933" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Evolucion;