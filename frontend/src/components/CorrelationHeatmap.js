import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfIcon from "../resources/pdf.png";
import csvIcon from "../resources/csv.png";

const FILTER_OPTIONS = [
  { value: "hour", label: "Última hora - Todos los registros" },
  { value: "day", label: "Últimas 24 horas - Datos agregados" },
  { value: "week", label: "Últimos 7 días - Datos agregados" },
  { value: "month", label: "Último mes - Datos agregados" },
  { value: "year", label: "Año actual - Datos agregados" },
];

const VARIABLES = [
  { key: 'AQI', label: 'AQI', fullName: 'Índice de Calidad del Aire' },
  { key: 'temperature', label: 'TEMP', fullName: 'Temperatura (°C)' },
  { key: 'humidity', label: 'HUM', fullName: 'Humedad (%)' },
  { key: 'PM1', label: 'PM1', fullName: 'Partículas PM1 (μg/m³)' },
  { key: 'PM2', label: 'PM2.5', fullName: 'Partículas PM2.5 (μg/m³)' },
  { key: 'PM10', label: 'PM10', fullName: 'Partículas PM10 (μg/m³)' }
];

const CORRELATION_COLORS = {
  strong: { positive: '#1B5E20', negative: '#B71C1C' },
  moderate: { positive: '#2E7D32', negative: '#C62828' },
  weak: { positive: '#43A047', negative: '#D32F2F' },
  minimal: { positive: '#66BB6A', negative: '#EF5350' },
  none: '#E0E0E0'
};

const CorrelationHeatmap = () => {
  const [data, setData] = useState([]);
  const [correlationMatrix, setCorrelationMatrix] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState("");
  const [filter, setFilter] = useState("week");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [lastUpdate, setLastUpdate] = useState("");

  // --- Refs ---
  const contentRef = useRef(null);
  const heatmapContainerRef = useRef(null);

  // --- Responsive helpers ---
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

  // Tamaños responsivos del grid del heatmap (sin scroll horizontal)
  const [cellSize, setCellSize] = useState(70);
  const [labelColWidth, setLabelColWidth] = useState(86);
  const gridGap = 6; // px

  // Recalcular tamaños en base al ancho del contenedor real
  useEffect(() => {
    const computeSizes = () => {
      const container = heatmapContainerRef.current;
      if (!container) return;
      const totalWidth = container.clientWidth;

      const cols = VARIABLES.length;
      const labelW = isXS ? 56 : isSM ? 72 : 86; // ancho de columna de etiquetas (fila/columna)
      // espacio disponible para celdas: total - label - gaps
      const available = totalWidth - labelW - gridGap * (cols + 1);

      // limitar celda entre 36px y 86px para legibilidad
      const size = Math.max(36, Math.min(86, Math.floor(available / cols)));

      setLabelColWidth(labelW);
      setCellSize(size);
    };

    computeSizes();

    // ResizeObserver para cambios del contenedor (más preciso que window.resize)
    let ro;
    if (typeof ResizeObserver !== "undefined" && heatmapContainerRef.current) {
      ro = new ResizeObserver(() => computeSizes());
      ro.observe(heatmapContainerRef.current);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, [winWidth]);

  // Fetch devices on mount
  useEffect(() => {
    fetch("/api/sensors/devices")
      .then(res => res.json())
      .then(deviceIds => setDevices(deviceIds.map(id => ({ _id: id, name: id }))))
      .catch(err => console.error("Device fetch error", err));
  }, []);

  // Fetch and process data when filter or device changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setNoDataMessage("");
        
        const res = await fetch("/api/sensors/get");
        if (!res.ok) throw new Error(`Error ${res.status}: No se pudieron obtener datos`);
        
        const rawData = await res.json();
        setLastUpdate(new Date().toISOString());

        const filteredData = filterDataByTimeAndDevice(rawData, filter, selectedDevice);
        
        if (filteredData.length < 2) {
          setNoDataMessage("Se necesitan al menos 2 registros para calcular correlaciones");
          setData([]);
          setCorrelationMatrix([]);
          return;
        }

        setData(filteredData);
        setCorrelationMatrix(calculateCorrelationMatrix(filteredData));
      } catch (err) {
        console.error("Error fetching data:", err);
        setNoDataMessage(`Error al obtener los datos: ${err.message}`);
        setData([]);
        setCorrelationMatrix([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, selectedDevice]);

  const filterDataByTimeAndDevice = (rawData, filterType, deviceId) => {
    const now = new Date();
    const timeRanges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    const startDate = new Date(now.getTime() - (timeRanges[filterType] || timeRanges.week));

    return rawData.filter(item => {
      const itemDate = new Date(item.timestamp);
      const inTimeRange = itemDate >= startDate && itemDate <= now;
      const matchesDevice = deviceId === "all" || item.device_id === deviceId;
      const hasValidData = VARIABLES.every(variable => 
        item[variable.key] !== null && 
        item[variable.key] !== undefined && 
        !isNaN(parseFloat(item[variable.key]))
      );
      return inTimeRange && matchesDevice && hasValidData;
    });
  };

  const calculateCorrelationMatrix = (dataset) => {
    return VARIABLES.map((varX, i) =>
      VARIABLES.map((varY, j) => ({
        x: varX.label,
        y: varY.label,
        xFull: varX.fullName,
        yFull: varY.fullName,
        value: calculatePearsonCorrelation(
          dataset.map(d => parseFloat(d[varX.key])),
          dataset.map(d => parseFloat(d[varY.key]))
        ),
        xIndex: i,
        yIndex: j
      }))
    );
  };

  const calculatePearsonCorrelation = (x, y) => {
    const n = x.length;
    if (n === 0) return 0;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getCorrelationColor = (correlation) => {
    const abs = Math.abs(correlation);
    const isPositive = correlation > 0;
    if (abs >= 0.8) return isPositive ? CORRELATION_COLORS.strong.positive : CORRELATION_COLORS.strong.negative;
    if (abs >= 0.6) return isPositive ? CORRELATION_COLORS.moderate.positive : CORRELATION_COLORS.moderate.negative;
    if (abs >= 0.4) return isPositive ? CORRELATION_COLORS.weak.positive : CORRELATION_COLORS.weak.negative;
    if (abs >= 0.2) return isPositive ? CORRELATION_COLORS.minimal.positive : CORRELATION_COLORS.minimal.negative;
    return CORRELATION_COLORS.none;
  };

  const getCorrelationLabel = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return 'Fuerte';
    if (abs >= 0.6) return 'Moderada-Fuerte';
    if (abs >= 0.4) return 'Moderada';
    if (abs >= 0.2) return 'Débil';
    return 'Ninguna';
  };

const exportToPDF = async () => {
  if (!contentRef.current) return;
  try {
    const canvas = await html2canvas(contentRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY // ensures capture starts at top
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4'); // landscape A4

    // A4 landscape size
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit inside PDF while keeping aspect ratio
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    // Center image
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`correlaciones-${filter}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error al exportar PDF');
  }
};

  const exportToCSV = () => {
    if (correlationMatrix.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    const headers = ['Variable X', 'Variable Y', 'Correlación', 'Fuerza'];
    const csvContent = [
      headers.join(','),
      ...correlationMatrix.flat().map(cell => [
        `"${cell.xFull}"`,
        `"${cell.yFull}"`,
        cell.value.toFixed(3),
        `"${getCorrelationLabel(cell.value)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `correlaciones-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getFilterDescription = () => {
    const descriptions = {
      hour: "Correlaciones basadas en registros de la última hora",
      day: "Correlaciones basadas en datos de las últimas 24 horas",
      week: "Correlaciones basadas en datos de los últimos 7 días",
      month: "Correlaciones basadas en datos del último mes (30 días)",
      year: "Correlaciones basadas en datos del año actual"
    };
    return descriptions[filter] || "";
  };

  const getMaxCorrelation = () => {
    if (correlationMatrix.length === 0) return '0.00';
    return Math.max(
      ...correlationMatrix.flat()
        .filter(cell => cell.xIndex !== cell.yIndex)
        .map(cell => Math.abs(cell.value))
    ).toFixed(2);
  };

  const getModerateCorrelationsCount = () => {
    if (correlationMatrix.length === 0) return 0;
    return correlationMatrix.flat()
      .filter(cell => cell.xIndex !== cell.yIndex && Math.abs(cell.value) >= 0.4)
      .length;
  };

  const StatCard = ({ icon, title, value, subtitle, color }) => (
    <div className="col-6 col-md-3 mb-2">
      <div className="card border-0 h-100 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.95) 100%)',
        backdropFilter: 'blur(20px)', 
        borderRadius: '20px'
      }}>
        <div className="card-body text-center py-2">
          <div className="d-flex align-items-center justify-content-center mb-1">
            <i className={`fas fa-${icon} me-2`} style={{ color, fontSize: '1rem' }}></i>
            <h6 className="card-title mb-0 fw-semibold" style={{ fontSize: 'clamp(0.8rem, 1.6vw, 0.95rem)' }}>{title}</h6>
          </div>
          <p className="card-text fw-bold mb-1" style={{ color, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>{value}</p>
          <small className="text-muted">{subtitle}</small>
        </div>
      </div>
    </div>
  );

  const HeatmapCell = ({ cell, size }) => (
    <div
      className="d-flex align-items-center justify-content-center text-white fw-bold position-relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: getCorrelationColor(cell.value),
        fontSize: size < 48 ? '0.65rem' : '0.75rem',
        cursor: 'pointer',
        borderRadius: size < 48 ? '10px' : '16px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      title={`${cell.xFull} vs ${cell.yFull}: ${cell.value.toFixed(3)} (${getCorrelationLabel(cell.value)})`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
        e.currentTarget.style.zIndex = '10';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.zIndex = '1';
      }}
    >
      <div style={{ fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        {cell.value.toFixed(size < 48 ? 1 : 2)}
      </div>
    </div>
  );

  const LegendItem = ({ range, label, color }) => (
    <div className="col">
      <div 
        className="badge px-2 py-2 w-100"
        style={{ 
          backgroundColor: color, 
          color: color === '#E0E0E0' ? '#333' : 'white',
          fontSize: 'clamp(0.65rem, 1.6vw, 0.8rem)', 
          fontWeight: 'bold',
          borderRadius: '12px'
        }}
      >
        <div>{range}</div>
        <div className="small">{label}</div>
      </div>
    </div>
  );

  return (
    <div ref={contentRef} style={{ overflowX: "hidden" }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <div>
          <h6 className="fw-bold mb-1" style={{ color: '#1a1d29', fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>
            <i className="fas fa-th me-2"></i>Matriz de Correlaciones - Variables Ambientales
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
            style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '12px' }}
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
            style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '12px' }}
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
            disabled={loading || correlationMatrix.length === 0}
            style={{ borderRadius: '12px' }}
          >
            <img src={pdfIcon} alt="PDF" width="16" height="16" className="me-1" />PDF
          </button>
          <button 
            className="btn btn-outline-primary btn-sm shadow-sm w-100 w-md-auto"
            onClick={exportToCSV}
            disabled={loading || correlationMatrix.length === 0}
            style={{ borderRadius: '12px' }}
          >
            <img src={csvIcon} alt="CSV" width="16" height="16" className="me-1" />CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {data.length > 0 && (
        <div className="row g-2 mb-3">
          <StatCard icon="database" title="Registros" value={data.length} subtitle="Datos analizados" color="#40C8FF" />
          <StatCard icon="th" title="Variables" value={VARIABLES.length} subtitle="Correlacionadas" color="#2E7D32" />
          <StatCard icon="chart-line" title="Mayor Correlación" value={getMaxCorrelation()} subtitle="Valor absoluto" color="#1B5E20" />
          <StatCard icon="link" title="Correlaciones" value={getModerateCorrelationsCount()} subtitle="Moderadas+" color="#FF6F00" />
        </div>
      )}

      {/* Heatmap (100% responsive, sin scroll horizontal) */}
      <div className="card border-0 shadow-sm mb-3" style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        borderRadius: '20px'
      }}>
        <div className="card-body p-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Calculando correlaciones...</p>
            </div>
          ) : noDataMessage ? (
            <div className="alert alert-warning border-0 text-center py-3" style={{
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
              borderRadius: '16px'
            }}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>{noDataMessage}</div>
            </div>
          ) : (
            <div ref={heatmapContainerRef} className="w-100">
              {/* Header (labels de columnas) */}
              <div
                className="d-grid mb-2"
                style={{
                  gridTemplateColumns: `${labelColWidth}px repeat(${VARIABLES.length}, ${cellSize}px)`,
                  gap: `${gridGap}px`
                }}
              >
                <div /> {/* esquina vacía */}
                {VARIABLES.map((v, idx) => (
                  <div
                    key={`col-${idx}`}
                    className="d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      height: `${Math.max(32, Math.min(40, Math.floor(cellSize * 0.6)))}px`,
                      fontSize: cellSize < 48 ? '0.65rem' : '0.75rem',
                      color: '#1a1d29',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={v.fullName}
                  >
                    {v.label}
                  </div>
                ))}
              </div>

              {/* Filas del heatmap */}
              <div className="d-flex flex-column" style={{ gap: `${gridGap}px` }}>
                {correlationMatrix.map((row, rIdx) => (
                  <div
                    key={`row-${rIdx}`}
                    className="d-grid align-items-center"
                    style={{
                      gridTemplateColumns: `${labelColWidth}px repeat(${VARIABLES.length}, ${cellSize}px)`,
                      gap: `${gridGap}px`
                    }}
                  >
                    {/* Etiqueta de fila */}
                    <div
                      className="d-flex align-items-center justify-content-end fw-bold pe-1"
                      style={{
                        fontSize: cellSize < 48 ? '0.65rem' : '0.75rem',
                        color: '#1a1d29',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={VARIABLES[rIdx].fullName}
                    >
                      {VARIABLES[rIdx].label}
                    </div>

                    {/* Celdas */}
                    {row.map((cell, cIdx) => (
                      <HeatmapCell key={`cell-${rIdx}-${cIdx}`} cell={cell} size={cellSize} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {correlationMatrix.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3">
            <h6 className="fw-semibold mb-3 text-center" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)' }}>
              <i className="fas fa-palette me-2"></i>Escala de Correlación
            </h6>
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-6 g-2 text-center mb-3">
              <LegendItem range="0.8 - 1.0" label="Fuerte +" color="#1B5E20" />
              <LegendItem range="0.6 - 0.8" label="Mod.-Fuerte" color="#2E7D32" />
              <LegendItem range="0.4 - 0.6" label="Moderada" color="#43A047" />
              <LegendItem range="0.2 - 0.4" label="Débil" color="#66BB6A" />
              <LegendItem range="0.0 - 0.2" label="Ninguna" color="#E0E0E0" />
              <LegendItem range="-1.0 - 0.0" label="Negativa" color="#B71C1C" />
            </div>
            <div className="text-center">
              <small className="text-muted">
                <strong>Interpretación:</strong> Valores positivos indican correlación directa; negativos, inversa.
                <br />
                <strong>Diagonal:</strong> Correlación perfecta (1.0) de cada variable consigo misma.
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrelationHeatmap;
