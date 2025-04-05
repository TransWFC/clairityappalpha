import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import NavbarComponent from "../components/NavbarComponent";
import SidebarComponent from "../components/SidebarComponent";
import { BsBell, BsFlag } from "react-icons/bs";
import "./Ai.css";

function Ai() {
  const navigate = useNavigate();
  const [cityData, setCityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          setError(null);
        } catch (err) {
          setError("Error al obtener datos. Asegúrate que el servidor Python está corriendo.");
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
      const res = await fetch(`/api/users/${userId}/toggle-alerts`, {
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

  const getCalidadAire = (pm25) => {
    if (!pm25) return { nivel: "Sin datos", color: "#666666" };
    if (pm25 <= 50) return { nivel: "Bueno", color: "#009966" };
    if (pm25 <= 100) return { nivel: "Moderado", color: "#ffde33" };
    if (pm25 <= 150) return { nivel: "Insalubre para grupos sensibles", color: "#ff9933" };
    if (pm25 <= 200) return { nivel: "Insalubre", color: "#cc0033" };
    if (pm25 <= 300) return { nivel: "Muy insalubre", color: "#660099" };
    return { nivel: "Peligroso", color: "#7e0023" };
  };

  const prepareChartData = () => {
    if (!cityData || !cityData[selectedCity] || cityData[selectedCity].error) return [];
    
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

  const calculateVariation = () => {
    if (!cityData || !cityData[selectedCity]) {
      return "N/D";
    }
  
    const current = cityData[selectedCity].current?.value;
    const prediction = cityData[selectedCity].forecast?.combined?.[0]; // Primera predicción
  
    // Verificar que tenemos ambos valores
    if (current === undefined || current === null || 
        prediction === undefined || prediction === null) {
      console.warn("Faltan datos para calcular variación", {current, prediction});
      return "N/D";
    }
  
    // Convertir a números por seguridad
    const currentValue = Number(current);
    const predictionValue = Number(prediction);
  
    if (isNaN(currentValue) || isNaN(predictionValue)) {
      console.warn("Valores no numéricos", {currentValue, predictionValue});
      return "N/D";
    }
  
    // Calcular diferencia absoluta
    const difference = predictionValue - currentValue;
  
    // Calcular variación porcentual (evitando división por cero)
    if (currentValue === 0) {
      return difference === 0 ? "0%" : `${difference > 0 ? '+' : ''}${difference.toFixed(2)} µg/m³`;
    }
  
    const percentage = (difference / currentValue) * 100;
  
    // Formatear el resultado
    if (Math.abs(percentage) < 0.01) {  // Caso de cambio mínimo
      return "≈0%";
    }
  
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const handleNavigate = () => {
    navigate("/evolucion");  // Redirige a la página "/grafica"
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
  
  if (error) return (
    <div className="d-flex vh-100" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px", overflow: "hidden" }}>
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}
      <div className="flex-grow-1 d-flex flex-column h-100" 
        style={{ overflow: "hidden", marginLeft: userType === "admin" ? "250px" : "0" }}>
        <NavbarComponent handleLogout={handleLogout} />
        <div className="error">{error}</div>
      </div>
    </div>
  );
  
  if (!cityData) return (
    <div className="d-flex vh-100" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px", overflow: "hidden" }}>
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}
      <div className="flex-grow-1 d-flex flex-column h-100" 
        style={{ overflow: "hidden", marginLeft: userType === "admin" ? "250px" : "0" }}>
        <NavbarComponent handleLogout={handleLogout} />
        <div>No hay datos disponibles</div>
      </div>
    </div>
  );
  
  if (cityData[selectedCity]?.error) return (
    <div className="d-flex vh-100" style={{ fontFamily: "Raleway, sans-serif", paddingTop: "60px", overflow: "hidden" }}>
      {userType === "admin" && <SidebarComponent handleLogout={handleLogout} />}
      <div className="flex-grow-1 d-flex flex-column h-100" 
        style={{ overflow: "hidden", marginLeft: userType === "admin" ? "250px" : "0" }}>
        <NavbarComponent handleLogout={handleLogout} />
        <div className="error">Error en datos de {selectedCity}: {cityData[selectedCity].error}</div>
      </div>
    </div>
  );

  const chartData = prepareChartData();
  const currentCity = cityData[selectedCity];
  const currentValue = currentCity.current?.value;
  const calidadActual = getCalidadAire(currentValue);

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

        {/* Contenido de la aplicación Ai */}
        <div className="container py-3">
          <h1 className="text-center fw-bold mb-4">Modelo de Predicción de Calidad del Aire</h1>
          <p className="fecha-actual text-center">{format(new Date(), "EEEE dd MMMM yyyy HH:mm", { locale: es })}</p>
          
          <div className="city-selector mb-4">
            <label htmlFor="ciudad">Selecciona una ciudad: </label>
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
              onClick={handleNavigate}
            >
              Ir a Gráfica de Evolución del Aire
            </button>
          </div>
          
          <div className="tarjetas row mb-4">
            <div className="col-md-4 mb-3">
              <div className="tarjeta h-100 p-4 rounded-4 shadow-lg" style={{ borderLeft: `5px solid ${calidadActual.color}` }}>
                <h2>PM2.5 Actual</h2>
                <p className="valor display-4">{currentValue ? currentValue.toFixed(2) : "N/D"} µg/m³</p>
                <p className="calidad fw-bold" style={{ color: calidadActual.color }}>
                  {calidadActual.nivel}
                </p>
              </div>
            </div>
            
            <div className="col-md-4 mb-3">
              <div className="tarjeta h-100 p-4 rounded-4 shadow-lg">
                <h2>Variación (30 días)</h2>
                <p className="valor display-4">{calculateVariation()}</p>
              </div>
            </div>
            
            <div className="col-md-4 mb-3">
              <div className="tarjeta h-100 p-4 rounded-4 shadow-lg">
                <h2>Próxima Predicción</h2>
                <p className="valor display-4">
                  {currentCity.forecast?.combined?.length > 0 ? 
                    `${currentCity.forecast.combined[0].toFixed(2)} µg/m³` : "N/D"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grafico-container bg-light p-4 rounded-4 shadow-lg mb-4">
            <h2 className="text-center mb-4">Evolución y Predicción de PM2.5</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                />
                <YAxis 
                  label={{ 
                    value: 'PM2.5 (µg/m³)', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }} 
                />
                <Tooltip 
                  formatter={(value) => [`${value} µg/m³`, "PM2.5"]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pm25" 
                  name="PM2.5"
                  stroke="#8884d8" 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
         
          <div className="tabla-container bg-light p-4 rounded-4 shadow-lg">
            <h2 className="text-center mb-4">Detalles de Predicción</h2>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>PM2.5 (µg/m³)</th>
                    <th>Tipo</th>
                    <th>Calidad del Aire</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => {
                    const calidad = getCalidadAire(item.pm25);
                    return (
                      <tr key={index}>
                        <td>{item.fecha}</td>
                        <td>{item.pm25.toFixed(2)}</td>
                        <td>{item.tipo}</td>
                        <td style={{ color: calidad.color }}>{calidad.nivel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ai;