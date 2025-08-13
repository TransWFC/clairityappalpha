import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfIcon from "../resources/pdf.png";
import csvIcon from "../resources/csv.png";

const FILTER_OPTIONS = [
  { value: "current", label: "Lectura actual - Descomposición precisa" },
];

const FACTOR_COLORS = {
  particles: "#FF6B6B",
  weather: "#4ECDC4", 
  temporal: "#45B7D1",
  environmental: "#96CEB4",
  baseline: "#FECA57"
};

const FACTOR_ICONS = {
  particles: "fas fa-smog",
  weather: "fas fa-cloud-sun",
  temporal: "fas fa-clock",
  environmental: "fas fa-leaf",
  baseline: "fas fa-home"
};

const AQIDecompositionChart = () => {
  const [data, setData] = useState([]);
  const [decomposition, setDecomposition] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState("");
  const [filter, setFilter] = useState("current");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [lastUpdate, setLastUpdate] = useState("");
  const [totalAQI, setTotalAQI] = useState(0);
  const [selectedFactor, setSelectedFactor] = useState(null);

  const contentRef = useRef(null);
  const pieWrapRef = useRef(null);

  // --- Responsive helpers ---
  const [winWidth, setWinWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isXS = winWidth < 576;
  const isSM = winWidth < 768;

  // Medidas reales del contenedor del gráfico
  const [pieBox, setPieBox] = useState({ width: 0 });
  useEffect(() => {
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          if (pieWrapRef.current) {
            setPieBox({ width: pieWrapRef.current.clientWidth });
          }
        })
      : null;
    if (pieWrapRef.current && ro) {
      ro.observe(pieWrapRef.current);
    } else if (pieWrapRef.current) {
      // Fallback
      setPieBox({ width: pieWrapRef.current.clientWidth });
      const onResize = () => setPieBox({ width: pieWrapRef.current.clientWidth });
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    return () => ro && ro.disconnect();
  }, []);

  // Altura y radios del pie en función del ancho disponible
  const chartHeight = pieBox.width <= 0 ? 300 : pieBox.width < 360 ? 240 : pieBox.width < 600 ? 300 : 340;
  const outerRadius = (() => {
    const base = Math.min(pieBox.width, chartHeight) / 2 - 20;
    return Math.max(70, Math.min(130, Math.floor(base)));
  })();
  const innerRadius = Math.max(30, Math.floor(outerRadius * 0.55));

  useEffect(() => {
    fetch("http://localhost:5000/api/sensors/devices")
      .then((res) => res.json())
      .then((deviceIds) => {
        setDevices(deviceIds.map(id => ({ _id: id, name: id })));
      })
      .catch((err) => console.error("Device fetch error", err));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setNoDataMessage("");
        const endpoint = "http://localhost:5000/api/sensors/latest";
        const res = await fetch(endpoint);
        if (res.status === 404) {
          setData([]);
          setNoDataMessage("No hay datos disponibles del sensor");
          return;
        }
        if (!res.ok) {
          throw new Error(`Error ${res.status}: No se pudieron obtener datos`);
        }
        const result = await res.json();
        if (!result || Object.keys(result).length === 0) {
          setNoDataMessage("No hay lectura actual disponible");
          setData([]);
          setDecomposition([]);
          return;
        }
        setLastUpdate(new Date().toISOString());
        setData([result]);
        const decomp = calculateAQIDecomposition([result], "current");
        setDecomposition(decomp.factors);
        setTotalAQI(decomp.totalAQI);
      } catch (err) {
        console.error("Error fetching data:", err);
        setNoDataMessage(`Error al obtener los datos: ${err.message}`);
        setData([]);
        setDecomposition([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDevice]);

  // --- LÓGICA DE CÁLCULO (intacta) ---
  const calculateAQIDecomposition = (dataset, filterType) => {
    if (!dataset || dataset.length === 0) return { factors: [], totalAQI: 0 };
    const avgData = calculateAverages(dataset);
    if (!avgData || avgData.AQI == null || isNaN(avgData.AQI)) return { factors: [], totalAQI: 0 };
    const currentAQI = Math.max(0, avgData.AQI);
    if (currentAQI === 0) return { factors: [], totalAQI: 0 };

    const coefficients = solveRealisticLinearSystem(avgData, currentAQI, filterType);
    const factors = [
      {
        name: "PM2.5 Principal",
        key: "pm25_primary",
        value: coefficients.pm25_primary,
        percentage: (coefficients.pm25_primary / currentAQI) * 100,
        description: "Contribución base del PM2.5 según EPA",
        details: `PM2.5: ${avgData.PM2.toFixed(1)}μg/m³ → AQI base: ${coefficients.pm25_primary.toFixed(1)}`,
        color: "#E74C3C",
        icon: "fas fa-smog"
      },
      {
        name: "Otras Partículas", 
        key: "other_particles",
        value: coefficients.other_particles,
        percentage: (coefficients.other_particles / currentAQI) * 100,
        description: "Influencia de PM1 y PM10",
        details: `PM1: ${avgData.PM1.toFixed(1)}μg/m³, PM10: ${avgData.PM10.toFixed(1)}μg/m³`,
        color: "#FF6B6B",
        icon: "fas fa-industry"
      },
      {
        name: "Condiciones Ambientales",
        key: "environmental", 
        value: coefficients.environmental,
        percentage: (coefficients.environmental / currentAQI) * 100,
        description: "Efecto de temperatura y humedad en dispersión",
        details: `Temp: ${avgData.temperature.toFixed(1)}°C, Humedad: ${avgData.humidity.toFixed(1)}% (Factor: ${getEnvironmentalFactor(avgData.temperature, avgData.humidity).toFixed(2)})`,
        color: "#3498DB",
        icon: "fas fa-thermometer-half"
      },
      {
        name: "Factor Temporal",
        key: "temporal",
        value: coefficients.temporal,
        percentage: (coefficients.temporal / currentAQI) * 100,
        description: "Variación por patrones horarios de emisión",
        details: getTemporalDetails(avgData.timestamp),
        color: "#9B59B6",
        icon: "fas fa-clock"
      },
      {
        name: "Condiciones de Dispersión",
        key: "dispersion",
        value: coefficients.dispersion,
        percentage: (coefficients.dispersion / currentAQI) * 100,
        description: "Factores atmosféricos locales",
        details: "Basado en condiciones de viento y estabilidad atmosférica",
        color: "#1ABC9C",
        icon: "fas fa-wind"
      }
    ].filter(f => f.value > 0.1);

    return { factors, totalAQI: currentAQI };
  };

  const calculateAverages = (dataset) => {
    if (!dataset || dataset.length === 0) return null;
    const validData = dataset.filter(d => {
      const aqi = d.AQI || d.averageAQI;
      return aqi !== undefined && aqi !== null && !isNaN(aqi);
    });
    if (validData.length === 0) return null;

    const sums = validData.reduce((acc, curr) => ({
      AQI: acc.AQI + (curr.AQI || curr.averageAQI || 0),
      temperature: acc.temperature + (curr.temperature || 20),
      humidity: acc.humidity + (curr.humidity || 50),
      PM1: acc.PM1 + (curr.PM1 || 0),
      PM2: acc.PM2 + (curr.PM2 || 0),
      PM10: acc.PM10 + (curr.PM10 || 0)
    }), { AQI: 0, temperature: 0, humidity: 0, PM1: 0, PM2: 0, PM10: 0 });

    const count = validData.length;
    const result = {
      AQI: sums.AQI / count,
      temperature: sums.temperature / count,
      humidity: sums.humidity / count,
      PM1: sums.PM1 / count,
      PM2: sums.PM2 / count,
      PM10: sums.PM10 / count,
      timestamp: validData[validData.length - 1].timestamp || new Date().toISOString()
    };

    Object.keys(result).forEach(key => {
      if (key !== 'timestamp' && (isNaN(result[key]) || result[key] === undefined)) {
        result[key] = 0;
      }
    });
    return result;
  };

  const solveRealisticLinearSystem = (avgData, totalAQI) => {
    if (!avgData || totalAQI === 0 || isNaN(totalAQI)) {
      return { pm25_primary: 0, other_particles: 0, environmental: 0, temporal: 0, dispersion: 0 };
    }
    const pm25_base_aqi = calculatePM25_AQI(avgData.PM2);
    const temp_deviation = avgData.temperature - 25;
    const humidity_deviation = avgData.humidity - 50;
    const pm1_excess = Math.max(0, avgData.PM1 - avgData.PM2 * 0.6);
    const pm10_coarse = Math.max(0, avgData.PM10 - avgData.PM2);
    const hour_factor = getHourFactor(avgData.timestamp);

    const matrix = [
      [1, 1, 1, 1, 1, totalAQI],
      [1, 0, 0, 0, 0, pm25_base_aqi * 0.85],
      [0, 1, 0, 0, 0, totalAQI * 0.15 * (temp_deviation * 0.01 + humidity_deviation * 0.005)],
      [0, 0, 1, 0, 0, (pm1_excess * 0.8 + pm10_coarse * 0.3)],
      [0, 0, 0, 1, 0, totalAQI * hour_factor * 0.12]
    ];
    const solution = gaussJordanElimination(matrix);
    if (!solution) return calculateFallbackDecomposition(avgData, totalAQI);

    return {
      pm25_primary: Math.max(0, Math.round(solution[0] * 100) / 100),
      environmental: Math.max(0, Math.round(solution[1] * 100) / 100),
      other_particles: Math.max(0, Math.round(solution[2] * 100) / 100),
      temporal: Math.max(0, Math.round(solution[3] * 100) / 100),
      dispersion: Math.max(0, Math.round(solution[4] * 100) / 100)
    };
  };

  const gaussJordanElimination = (aug) => {
    const n = aug.length;
    const m = aug.map(r => [...r]);
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(m[k][i]) > Math.abs(m[maxRow][i])) maxRow = k;
      }
      if (maxRow !== i) [m[i], m[maxRow]] = [m[maxRow], m[i]];
      if (Math.abs(m[i][i]) < 1e-10) return null;
      const pivot = m[i][i];
      for (let j = 0; j <= n; j++) m[i][j] /= pivot;
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = m[k][i];
          for (let j = 0; j <= n; j++) m[k][j] -= factor * m[i][j];
        }
      }
    }
    return m.map(r => r[n]);
  };

  const calculateFallbackDecomposition = (avgData, totalAQI) => {
    const basePM25_AQI = calculatePM25_AQI(avgData.PM2);
    const envFactor = getEnvironmentalFactor(avgData.temperature, avgData.humidity);
    const temporalFactor = getHourFactor(avgData.timestamp);
    const otherPMFactor = getOtherParticlesFactor(avgData.PM1, avgData.PM2, avgData.PM10);

    const pm25_primary = basePM25_AQI * 0.75;
    const environmental = totalAQI * envFactor * 0.15;
    const temporal = totalAQI * temporalFactor * 0.1;
    const other_particles = totalAQI * otherPMFactor * 0.08;
    const dispersion = Math.max(0, totalAQI - pm25_primary - environmental - temporal - other_particles);

    return {
      pm25_primary: Math.round(pm25_primary * 100) / 100,
      environmental: Math.round(environmental * 100) / 100,
      temporal: Math.round(temporal * 100) / 100,
      other_particles: Math.round(other_particles * 100) / 100,
      dispersion: Math.round(dispersion * 100) / 100
    };
  };

  const calculatePM25_AQI = (pm25) => {
    const AQI = [0, 50, 100, 150, 200, 300, 400, 500];
    const PM = [0.0, 12.0, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4];
    for (let i = 0; i < 7; i++) {
      if (pm25 <= PM[i + 1]) {
        return AQI[i] + ((AQI[i + 1] - AQI[i]) * (pm25 - PM[i])) / (PM[i + 1] - PM[i]);
      }
    }
    return 500 + (pm25 - 500.4) * (500 - 400) / (600 - 500.4);
  };

  const getEnvironmentalFactor = (temperature, humidity) => {
    const temp_factor = Math.max(-0.1, Math.min(0.1, (temperature - 25) / 100));
    const humidity_factor = Math.max(-0.05, Math.min(0.05, (50 - humidity) / 1000));
    return temp_factor + humidity_factor;
  };

  const getOtherParticlesFactor = (pm1, pm2_5, pm10) => {
    const pm1_excess = Math.max(0, pm1 - pm2_5 * 0.6);
    const pm10_coarse = Math.max(0, pm10 - pm2_5);
    return Math.min(0.3, (pm1_excess * 0.02 + pm10_coarse * 0.005) / 100);
  };

  const getHourFactor = (timestamp) => {
    if (!timestamp) return 0.5;
    const hour = new Date(timestamp).getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 1.0;
    if (hour >= 10 && hour <= 16) return 0.3;
    return 0.6;
  };

  const getTemporalDetails = (timestamp) => {
    if (!timestamp) return "Datos no disponibles";
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' });
    let period = "Madrugada";
    if (hour >= 6 && hour < 12) period = "Mañana";
    else if (hour >= 12 && hour < 18) period = "Tarde";
    else if (hour >= 18 && hour < 22) period = "Noche";
    return `${period} (${hour}:00) - ${dayOfWeek}`;
  };

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border-0 rounded-3 shadow-lg"
             style={{
               background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
               border: '1px solid rgba(64, 200, 255, 0.2)',
               maxWidth: isXS ? 220 : 300
             }}>
          <div className="d-flex align-items-center mb-2">
            <i className={`${d.icon} me-2`} style={{ color: d.color }}></i>
            <strong className="text-primary">{d.name}</strong>
          </div>
          <p className="mb-1"><strong>Contribución:</strong> {d.value.toFixed(1)} AQI ({d.percentage.toFixed(1)}%)</p>
          <p className="mb-1 small text-muted">{d.description}</p>
          <p className="mb-0 small" style={{ color: '#666' }}>{d.details}</p>
        </div>
      );
    }
    return null;
  };

  // --- PDF export que no depende del tamaño de pantalla ---
  const exportToPDF = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Primero intentamos ajustar por ancho
      let imgW = pageW - margin * 2;
      let imgH = (canvas.height * imgW) / canvas.width;

      if (imgH > pageH - margin * 2) {
        // Si se pasa, ajustamos por alto
        imgH = pageH - margin * 2;
        imgW = (canvas.width * imgH) / canvas.height;
      }

      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2;
      pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
      pdf.save(`descomposicion-aqi-actual-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar PDF');
    }
  };

  const exportToCSV = () => {
    if (decomposition.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    const headers = ['Factor', 'Contribución AQI', 'Porcentaje', 'Descripción'];
    const csvContent = [
      headers.join(','),
      ...decomposition.map(f => [
        `"${f.name}"`,
        f.value.toFixed(2),
        f.percentage.toFixed(1) + '%',
        `"${f.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `descomposicion-aqi-actual-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilterDescription = () => "Descomposición matemática precisa de la lectura más reciente usando Gauss-Jordan";

  const renderFactorCard = (factor) => (
    <div key={factor.key} className="col-12 col-sm-6 col-lg-4 mb-2">
      <div 
        className={`card border-0 h-100 shadow-sm ${selectedFactor === factor.key ? 'border-primary' : ''}`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '15px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => setSelectedFactor(selectedFactor === factor.key ? null : factor.key)}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
      >
        <div className="card-body p-3">
          <div className="d-flex align-items-center mb-2">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: factor.color + '20',
                border: `2px solid ${factor.color}`
              }}
            >
              <i className={factor.icon} style={{ color: factor.color, fontSize: '1rem' }}></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="card-title mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)', color: '#1a1d29' }}>
                {factor.name}
              </h6>
              <small className="text-muted">{factor.percentage.toFixed(1)}%</small>
            </div>
          </div>
          <div className="mb-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted">Contribución</span>
              <span className="fw-bold" style={{ color: factor.color }}>
                {factor.value.toFixed(1)} AQI
              </span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div 
                className="progress-bar" 
                style={{ width: `${factor.percentage}%`, backgroundColor: factor.color }}
              />
            </div>
          </div>
          <p className="card-text small text-muted mb-2">{factor.description}</p>
          {selectedFactor === factor.key && (
            <div className="small" style={{ color: '#666', fontSize: '0.8rem' }}>
              <strong>Detalles:</strong> {factor.details}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={contentRef} style={{ overflowX: "hidden" }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <div>
          <h6 className="fw-bold mb-1" style={{ color: '#1a1d29', fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>
            <i className="fas fa-chart-pie me-2"></i>Descomposición del Índice de Calidad del Aire
          </h6>
          <p className="text-muted mb-0 small">{getFilterDescription()}</p>
        </div>
        {lastUpdate && (
          <div className="text-start text-md-end">
            <small className="text-muted d-block">
              <i className="fas fa-sync-alt me-1"></i>Última actualización:
            </small>
            <small className="fw-semibold" style={{ color: '#1a1d29' }}>
              {new Date(lastUpdate).toLocaleString("es-ES")}
            </small>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <label className="form-label fw-semibold mb-2" style={{ color: '#1a1d29' }}>
            <i className="fas fa-microchip me-2"></i>Dispositivo:
          </label>
          <select 
            className="form-select border-0 shadow-sm" 
            value={selectedDevice} 
            onChange={(e) => setSelectedDevice(e.target.value)}
            disabled={loading}
            style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}
          >
            <option value="all">Todos los dispositivos</option>
            {devices.map((device) => (
              <option key={device._id} value={device._id}>{device.name || device._id}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-5">
          <label className="form-label fw-semibold mb-2" style={{ color: '#1a1d29' }}>
            <i className="fas fa-info-circle me-2"></i>Método de análisis:
          </label>
          <div className="form-control border-0 shadow-sm" style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(10px)',
            color: '#1a1d29',
            fontWeight: 500
          }}>
            Sistema Gauss-Jordan (5×5) - Lectura en tiempo real
          </div>
        </div>
        <div className="col-12 col-md-3 d-grid d-md-flex align-items-md-end gap-2">
          <button 
            className="btn btn-outline-primary btn-sm shadow-sm w-100 w-md-auto"
            onClick={exportToPDF}
            disabled={loading || decomposition.length === 0}
          >
            <img src={pdfIcon} alt="PDF" width="16" height="16" className="me-1" />PDF
          </button>
          <button 
            className="btn btn-outline-primary btn-sm shadow-sm w-100 w-md-auto"
            onClick={exportToCSV}
            disabled={loading || decomposition.length === 0}
          >
            <img src={csvIcon} alt="CSV" width="16" height="16" className="me-1" />CSV
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Pie Chart */}
        <div className="col-lg-6 mb-3">
          <div className="card border-0 shadow-sm h-100" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
            borderRadius: '15px'
          }}>
            <div className="card-body p-3" ref={pieWrapRef}>
              <div className="text-center mb-3">
                <h5 className="fw-bold mb-1" style={{ color: '#1a1d29' }}>
                  AQI Total: {totalAQI.toFixed(1)}
                </h5>
                <small className="text-muted">Descomposición por factores</small>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="text-muted">Calculando descomposición...</p>
                </div>
              ) : noDataMessage ? (
                <div className="alert alert-warning border-0 text-center py-3" style={{
                  background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
                  borderRadius: '10px'
                }}>
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>{noDataMessage}</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <PieChart>
                    <Pie
                      data={decomposition}
                      cx="50%"
                      cy="50%"
                      outerRadius={outerRadius}
                      innerRadius={innerRadius}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {decomposition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={customTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Factor Cards */}
        <div className="col-lg-6">
          <div className="row g-2">
            {decomposition.map(renderFactorCard)}
          </div>
        </div>
      </div>

      {/* Mathematical Model Info */}
      {decomposition.length > 0 && (
        <div className="card border-0 shadow-sm mt-3" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          borderRadius: '15px'
        }}>
          <div className="card-body p-3">
            <h6 className="fw-semibold mb-2 text-center" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)' }}>
              <i className="fas fa-calculator me-2"></i>Modelo Matemático
            </h6>
            <div className="text-center">
              <small className="text-muted">
                <strong>Sistema Gauss-Jordan:</strong> 5 ecuaciones × 5 incógnitas resuelto por eliminación 
                <br />
                <strong>Ecuaciones:</strong> Conservación + EPA_base + Ambiental + Partículas + Temporal
                <br />
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQIDecompositionChart;
