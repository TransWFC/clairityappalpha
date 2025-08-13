import React, { useState, useEffect, useRef } from "react"; 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfIcon from "../resources/pdf.png";
import csvIcon from "../resources/csv.png";


const FILTER_OPTIONS = [
  { value: "hour", label: "Última hora - Todos los registros" },
  { value: "day", label: "Últimas 24 horas - Promedio por hora" },
  { value: "week", label: "Últimos 7 días - Promedio diario" },
  { value: "month", label: "Último mes - Promedio diario" },
  { value: "year", label: "Año actual - Promedio mensual" },
];

const AQI_RANGES = [
  { range: "0-50", label: "Buena", color: "#00E676" },
  { range: "51-100", label: "Moderada", color: "#FFD54F" },
  { range: "101-150", label: "Dañina para sensibles", color: "#FF8A65" },
  { range: "151-200", label: "Dañina", color: "#EF5350" },
  { range: "201-300", label: "Muy dañina", color: "#AB47BC" },
  { range: "301+", label: "Peligrosa", color: "#8D6E63" }
];

const AirQualityChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState("");
  const [filter, setFilter] = useState("hour");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [lastUpdate, setLastUpdate] = useState("");
  const chartRef = useRef(null);
  const contentRef = useRef(null);

  // ---- Responsive helpers ----
  const [winWidth, setWinWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isXS = winWidth < 576;
  const isSM = winWidth < 768;
  const chartHeight = isXS ? 260 : isSM ? 320 : 380;
  const xAngle = data.length > (isXS ? 6 : 10) ? -45 : 0;
  const xAnchor = xAngle ? "end" : "middle";
  const xInterval = xAngle ? "preserveStartEnd" : 0;
  const chartMargin = { top: 20, right: 16, left: isXS ? 10 : 20, bottom: xAngle ? 70 : 30 };

  useEffect(() => {
    fetch("/api/sensors/devices")
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

      // ✅ Construye la URL con querystring, sin usar new URL
      const params = new URLSearchParams({ filter });
      if (selectedDevice !== "all") params.append("device", selectedDevice);

      const res = await fetch(`/api/sensors/history?${params.toString()}`);
      if (res.status === 404) {
        setData([]);
        setNoDataMessage("No hay datos disponibles para este período y dispositivo");
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}: No se pudieron obtener datos`);

      const result = await res.json();
      setLastUpdate(result.lastUpdate);

      const parsed = processDataWithGaps(result.data, filter);
      if (parsed.length === 0) setNoDataMessage("No hay datos disponibles para este filtro y dispositivo");
      setData(parsed);
    } catch (err) {
      console.error("Error fetching data:", err);
      setNoDataMessage(`Error al obtener los datos: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [filter, selectedDevice]);


  const processDataWithGaps = (rawData, filterType) => {
    if (!rawData || rawData.length === 0) return [];

    const processed = rawData.map((item) => {
      const { displayLabel, fullTimestamp } = formatTimestamp(item, filterType);
      const aqi = filterType === "hour" ? item.AQI : item.averageAQI;
      return {
        timestamp: displayLabel,
        fullTimestamp: fullTimestamp,
        AQI: Math.round(aqi * 100) / 100,
        count: filterType === "hour" ? 1 : item.count,
        originalData: item,
      };
    }).filter(item => item.timestamp && !isNaN(item.AQI));

    return processed; // Recharts cortará las líneas cuando falten puntos (connectNulls={false})
  };

  const formatTimestamp = (item, filterType) => {
    let displayLabel = "";
    let fullTimestamp = "";
    
    switch (filterType) {
      case "hour":
        if (item.timestamp) {
          const date = new Date(item.timestamp);
          displayLabel = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
          fullTimestamp = date.toLocaleString("es-ES", {
            year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
          });
        }
        break;
      case "day":
        if (item.hour && item.date) {
          const hourNum = item.hour.split(":")[0];
          displayLabel = `${hourNum}:00`;
          fullTimestamp = `${item.date} - ${item.hour}`;
        }
        break;
      case "week":
      case "month":
        if (item.date) {
          const date = new Date(item.date + "T00:00:00");
          displayLabel = date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
          fullTimestamp = date.toLocaleDateString("es-ES", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
          });
        }
        break;
      case "year":
        if (item.month) {
          const [year, monthNum] = item.month.split("-");
          const date = new Date(year, monthNum - 1, 1);
          displayLabel = date.toLocaleDateString("es-ES", { month: "short" });
          fullTimestamp = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
        }
        break;
    }
    
    return { displayLabel, fullTimestamp };
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return "#00E676";
    if (aqi <= 100) return "#FFD54F";
    if (aqi <= 150) return "#FF8A65";
    if (aqi <= 200) return "#EF5350";
    if (aqi <= 300) return "#AB47BC";
    return "#8D6E63";
  };

  const getAQILabel = (aqi) => {
    if (aqi <= 50) return "Buena";
    if (aqi <= 100) return "Moderada";
    if (aqi <= 150) return "Dañina para grupos sensibles";
    if (aqi <= 200) return "Dañina";
    if (aqi <= 300) return "Muy dañina";
    return "Peligrosa";
  };

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const aqi = payload[0].value;
      return (
        <div className="bg-white p-3 border-0 rounded-3 shadow-lg" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          border: '1px solid rgba(64, 200, 255, 0.2)',
          maxWidth: isXS ? 220 : 280
        }}>
          <p className="mb-2 fw-bold text-primary" style={{ fontSize: isXS ? 12 : 14 }}>{d.fullTimestamp}</p>
          <p className="mb-1" style={{ fontSize: isXS ? 12 : 14 }}>
            <strong>AQI:</strong> <span style={{ color: getAQIColor(aqi) }}>{aqi}</span>
          </p>
          <p className="mb-1" style={{ color: getAQIColor(aqi), fontSize: isXS ? 12 : 14 }}>
            <strong>Calidad:</strong> {getAQILabel(aqi)}
          </p>
          {d.count > 1 && (
            <p className="mb-0 small text-muted">Promedio de {d.count} registros</p>
          )}
        </div>
      );
    }
    return null;
  };

const exportToPDF = async () => {
  if (!contentRef.current) return;
  try {
    const canvas = await html2canvas(contentRef.current, {
      scale: 2, // higher scale for sharper output
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');

    // Create PDF in landscape A4
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions while keeping aspect ratio
    const imgWidth = pageWidth - 20; // 10mm margin each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPosition = 10;
    if (imgHeight > pageHeight - 20) {
      // If too tall, scale based on height instead
      const scaledHeight = pageHeight - 20;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
      pdf.addImage(imgData, 'PNG', (pageWidth - scaledWidth) / 2, 10, scaledWidth, scaledHeight);
    } else {
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
    }

    pdf.save(`calidad-aire-${filter}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error al exportar PDF');
  }
};


  const exportToCSV = () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    const headers = ['Período Completo', 'AQI', 'Calidad del Aire', 'Registros'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.fullTimestamp}"`, row.AQI, `"${getAQILabel(row.AQI)}"`, row.count
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calidad-aire-${filter}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <div className="col-6 col-md-3 mb-2">
      <div className="card border-0 h-100 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '15px'
      }}>
        <div className="card-body text-center py-2">
          <div className="d-flex align-items-center justify-content-center mb-1">
            <i className={`${icon} me-2`} style={{ color, fontSize: '1rem' }}></i>
            <h6 className="card-title mb-0 fw-semibold" style={{ fontSize: 'clamp(0.8rem, 1.6vw, 0.95rem)' }}>{title}</h6>
          </div>
          <p className="card-text fw-bold mb-1" style={{ color, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>{value}</p>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
      </div>
    </div>
  );

  const renderStats = () => {
    if (data.length === 0) return null;

    const aqiValues = data.map(d => d.AQI);
    const avgAQI = aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length;
    const maxAQI = Math.max(...aqiValues);
    const minAQI = Math.min(...aqiValues);
    const totalRecords = data.reduce((sum, d) => sum + d.count, 0);

    return (
      <div className="row g-2 mb-3">
        <StatCard 
          title="Promedio" value={Math.round(avgAQI)} color={getAQIColor(avgAQI)}
          icon="fas fa-chart-line" subtitle={getAQILabel(avgAQI)}
        />
        <StatCard 
          title="Máximo" value={maxAQI} color={getAQIColor(maxAQI)}
          icon="fas fa-arrow-up" subtitle={getAQILabel(maxAQI)}
        />
        <StatCard 
          title="Mínimo" value={minAQI} color={getAQIColor(minAQI)}
          icon="fas fa-arrow-down" subtitle={getAQILabel(minAQI)}
        />
        <StatCard 
          title="Puntos" value={data.length} color="#40C8FF"
          icon="fas fa-database" subtitle={`${totalRecords} registros`}
        />
      </div>
    );
  };

  const getFilterDescription = () => {
    const descriptions = {
      hour: "Mostrando todos los registros individuales de la última hora",
      day: "Mostrando promedio por hora durante las últimas 24 horas", 
      week: "Mostrando promedio diario durante los últimos 7 días",
      month: "Mostrando promedio diario durante el último mes (30 días)",
      year: "Mostrando promedio mensual durante el año actual"
    };
    return descriptions[filter] || "";
  };

  const getYAxisDomain = () => {
    if (data.length === 0) return [0, 350];
    const maxAQI = Math.max(...data.map(d => d.AQI));
    const padding = Math.max(20, maxAQI * 0.1);
    const upperLimit = Math.ceil(Math.min(maxAQI + padding, 500) / 10) * 10;
    return [0, upperLimit];
  };

  return (
    <div ref={contentRef} style={{ overflowX: "hidden" }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <div>
          <h6 className="fw-bold mb-1" style={{ color: '#1a1d29', fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>
            <i className="fas fa-wind me-2"></i>Monitoreo de Calidad del Aire
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
            <i className="fas fa-clock me-2"></i>Período de análisis:
          </label>
          <select 
            className="form-select border-0 shadow-sm" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            disabled={loading}
            style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-3 d-grid d-md-flex align-items-md-end gap-2">
          <button 
            className="btn btn-outline-primary btn-sm shadow-sm w-100 w-md-auto"
            onClick={exportToPDF}
            disabled={loading || data.length === 0}
          >
            <img src={pdfIcon} alt="PDF" width="16" height="16" className="me-1" />PDF
          </button>
          <button 
            className="btn btn-outline-primary btn-sm shadow-sm w-100 w-md-auto"
            onClick={exportToCSV}
            disabled={loading || data.length === 0}
          >
            <img src={csvIcon} alt="CSV" width="16" height="16" className="me-1" />CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Chart */}
      <div className="card border-0 shadow-sm mb-3" style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        borderRadius: '15px'
      }}>
        <div className="card-body p-2 p-sm-3" ref={chartRef}>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Analizando datos de calidad del aire...</p>
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
              <LineChart data={data} margin={chartMargin}>
                <defs>
                  <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#40C8FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#40C8FF" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(64, 200, 255, 0.2)" />
                <XAxis 
                  dataKey="timestamp" 
                  angle={xAngle}
                  textAnchor={xAnchor}
                  height={xAngle ? 70 : 40}
                  interval={xInterval}
                  tick={{ fontSize: isXS ? 9 : 11, fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  label={{ 
                    value: "Índice de Calidad del Aire (AQI)", 
                    angle: -90, 
                    position: "insideLeft",
                    style: { textAnchor: 'middle', fill: '#666', fontSize: isXS ? '10px' : '12px' }
                  }}
                  domain={getYAxisDomain()}
                  tickCount={6}
                  tickFormatter={(value) => Math.round(value)}
                  tick={{ fontSize: isXS ? 9 : 11, fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip content={customTooltip} />
                <Line 
                  type="monotone" 
                  dataKey="AQI" 
                  stroke="#40C8FF" 
                  strokeWidth={3} 
                  dot={{ r: isXS ? 3 : 5, fill: "#40C8FF", strokeWidth: 2, stroke: "#ffffff" }}
                  activeDot={{ 
                    r: isXS ? 5 : 7, fill: "#0288D1", strokeWidth: 3, stroke: "#ffffff",
                    style: { filter: 'drop-shadow(0 4px 8px rgba(64, 200, 255, 0.4))' }
                  }}
                  fill="url(#aqiGradient)"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AQI Legend */}
      {data.length > 0 && (
        <div className="card border-0 shadow-sm" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
          borderRadius: '15px'
        }}>
          <div className="card-body p-3">
            <h6 className="fw-semibold mb-2 text-center" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)' }}>
              <i className="fas fa-palette me-2"></i>Escala de Calidad del Aire
            </h6>
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-6 g-2 text-center">
              {AQI_RANGES.map((item, idx) => (
                <div key={idx} className="col">
                  <div 
                    className="badge px-2 py-2 w-100"
                    style={{ 
                      backgroundColor: item.color, color: 'white',
                      fontSize: 'clamp(0.65rem, 1.6vw, 0.8rem)', fontWeight: 'bold',
                      borderRadius: 10
                    }}
                  >
                    <div>{item.range}</div>
                    <div className="small">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirQualityChart;
