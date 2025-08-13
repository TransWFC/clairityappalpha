import React, { useState, useEffect, useMemo, useRef } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfIcon from "../resources/pdf.png";
import csvIcon from "../resources/csv.png";

const defaultCenter = { lat: 20.5888, lng: -100.3899 };

const METRIC_OPTIONS = [
  { value: "AQI", label: "Índice de Calidad del Aire (AQI)", icon: "fas fa-smog", unit: "" },
  { value: "temperature", label: "Temperatura", icon: "fas fa-thermometer-half", unit: "°C" },
  { value: "humidity", label: "Humedad Relativa", icon: "fas fa-tint", unit: "%" },
];

const SensorMap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("AQI");
  const [devices, setDevices] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const contentRef = useRef(null);

  // === Responsive helpers ===
  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isXS = winW < 576;
  const isSM = winW < 768;

  const mapContainerStyle = useMemo(() => {
    // Altura fluida en función del viewport.
    // XS: 42–50vh; SM: 48–54vh; MD+: 52–60vh (limitado por clamp)
    const height = isXS
      ? "clamp(260px, 45vh, 420px)"
      : isSM
      ? "clamp(300px, 50vh, 480px)"
      : "clamp(360px, 56vh, 560px)";
    return {
      width: "100%",
      height,
      borderRadius: "15px",
    };
  }, [isXS, isSM]);

  // Opciones de mapa: UI más limpia en pantallas pequeñas
  const mapOptions = useMemo(
    () => ({
      clickableIcons: false,
      streetViewControl: !isXS,
      mapTypeControl: !isXS,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "all",
          elementType: "geometry.fill",
          stylers: [{ saturation: -15 }, { lightness: 15 }],
        },
      ],
    }),
    [isXS]
  );

  // Guardar instancia del mapa para fitBounds
  const mapRef = useRef(null);
  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/sensors/devices")
      .then((res) => res.json())
      .then((deviceIds) => {
        setDevices(deviceIds.map((id) => ({ _id: id, name: id })));
      })
      .catch((err) => console.error("Device fetch error", err));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setNoDataMessage("");

        const promises = devices.map(async (device) => {
          try {
            const res = await fetch(`http://localhost:5000/api/sensors/latest?device=${device._id}`);
            if (res.ok) {
              const json = await res.json();
              return { ...json, device_id: device._id };
            }
            return null;
          } catch {
            return null;
          }
        });

        const results = await Promise.all(promises);
        const validData = results.filter((item) => item && item.location);
        setData(validData);

        if (validData.length === 0) {
          setNoDataMessage("No hay dispositivos con datos de ubicación disponibles");
        } else {
          // Centro por promedio si no haremos fitBounds (p.ej. 1 punto)
          const coordinates = validData.map((d) => parseCoordinates(d.location)).filter(Boolean);
          if (coordinates.length > 0) {
            const avgLat = coordinates.reduce((s, c) => s + c[0], 0) / coordinates.length;
            const avgLng = coordinates.reduce((s, c) => s + c[1], 0) / coordinates.length;
            setMapCenter({ lat: avgLat, lng: avgLng });
          }
        }

        setLastUpdate(new Date().toISOString());
      } catch (err) {
        console.error("Error fetching data:", err);
        setNoDataMessage(`Error al obtener los datos: ${err.message}`);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (devices.length > 0) {
      fetchData();
    }
  }, [devices]);

  // Ajustar vista a todos los marcadores cuando haya datos o cambie el tamaño
  useEffect(() => {
    if (!mapRef.current || data.length === 0 || typeof window === "undefined") return;

    const bounds = new window.google.maps.LatLngBounds();
    data.forEach((d) => {
      const c = parseCoordinates(d.location);
      if (c) bounds.extend({ lat: c[0], lng: c[1] });
    });

    // Si hay al menos 2 marcadores: encuadra; si solo 1, centra y define zoom
    if (!bounds.isEmpty()) {
      if (data.length > 1) {
        mapRef.current.fitBounds(bounds, isXS ? 20 : 40);
      } else {
        const c = parseCoordinates(data[0].location);
        if (c) {
          mapRef.current.setCenter({ lat: c[0], lng: c[1] });
          mapRef.current.setZoom(13);
        }
      }
    }
  }, [data, isXS, isSM]);

  const parseCoordinates = (location) => {
    if (!location) return null;
    try {
      if (typeof location === "string") {
        const coords = location.split(",").map((c) => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) return coords;
      } else if (Array.isArray(location) && location.length === 2) {
        const [a, b] = location;
        return [parseFloat(a), parseFloat(b)];
      }
    } catch {}
    return null;
  };

  const getMetricValue = (device, metric) => {
    const value = device[metric];
    if (value === undefined || value === null) return "N/A";
    return typeof value === "number" ? value.toFixed(1) : value;
  };

  const getMetricColor = (device, metric) => {
    const value = device[metric];
    if (value === undefined || value === null) return "#95A5A6";
    switch (metric) {
      case "AQI":
        if (value <= 50) return "#00E676";
        if (value <= 100) return "#FFD54F";
        if (value <= 150) return "#FF8A65";
        if (value <= 200) return "#EF5350";
        if (value <= 300) return "#AB47BC";
        return "#8D6E63";
      case "temperature":
        if (value < 15) return "#3498DB";
        if (value < 25) return "#2ECC71";
        if (value < 30) return "#F39C12";
        if (value < 35) return "#E67E22";
        return "#E74C3C";
      case "humidity":
        if (value < 30) return "#E74C3C";
        if (value < 60) return "#2ECC71";
        if (value < 80) return "#F39C12";
        return "#3498DB";
      default:
        return "#95A5A6";
    }
  };

  const getMetricLabel = (value, metric) => {
    if (value === "N/A") return "Sin datos";
    switch (metric) {
      case "AQI": {
        const v = parseFloat(value);
        if (v <= 50) return "Buena";
        if (v <= 100) return "Moderada";
        if (v <= 150) return "Dañina para sensibles";
        if (v <= 200) return "Dañina";
        if (v <= 300) return "Muy dañina";
        return "Peligrosa";
      }
      case "temperature": {
        const v = parseFloat(value);
        if (v < 15) return "Frío";
        if (v < 25) return "Agradable";
        if (v < 30) return "Cálido";
        if (v < 35) return "Caliente";
        return "Muy caliente";
      }
      case "humidity": {
        const v = parseFloat(value);
        if (v < 30) return "Muy seco";
        if (v < 60) return "Confortable";
        if (v < 80) return "Húmedo";
        return "Muy húmedo";
      }
      default:
        return "";
    }
  };

  const currentMetric = METRIC_OPTIONS.find((opt) => opt.value === selectedMetric);

  // PDF responsivo (encaja en A4)
  const exportToPDF = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;

      let imgW = pageW - margin * 2;
      let imgH = (canvas.height * imgW) / canvas.width;
      if (imgH > pageH - margin * 2) {
        imgH = pageH - margin * 2;
        imgW = (canvas.width * imgH) / canvas.height;
      }
      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2;
      pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
      pdf.save(`mapa-sensores-${selectedMetric}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error al exportar PDF");
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    const headers = ["Dispositivo", "Ubicación", selectedMetric, "Clasificación", "Última Actualización"];
    const csvContent = [
      headers.join(","),
      ...data.map((device) => {
        const value = getMetricValue(device, selectedMetric);
        const label = getMetricLabel(value, selectedMetric);
        return [
          `"${device.device_id}"`,
          `"${device.location}"`,
          value,
          `"${label}"`,
          `"${new Date(device.timestamp || "").toLocaleString("es-ES")}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `mapa-sensores-${selectedMetric}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDeviceInfo = () => {
    if (data.length === 0) return null;

    const totalDevices = data.length;
    const avgValue =
      data.reduce((sum, device) => {
        const v = parseFloat(getMetricValue(device, selectedMetric));
        return sum + (isNaN(v) ? 0 : v);
      }, 0) / totalDevices;

    const maxDevice = data.reduce((max, device) => {
      const v = parseFloat(getMetricValue(device, selectedMetric));
      const mv = parseFloat(getMetricValue(max, selectedMetric));
      return v > mv ? device : max;
    });

    const minDevice = data.reduce((min, device) => {
      const v = parseFloat(getMetricValue(device, selectedMetric));
      const mv = parseFloat(getMetricValue(min, selectedMetric));
      return v < mv ? device : min;
    });

    return (
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <div className="card border-0 h-100 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.95) 100%)", backdropFilter: "blur(20px)", borderRadius: "15px" }}>
            <div className="card-body text-center py-2">
              <div className="d-flex align-items-center justify-content-center mb-1">
                <i className="fas fa-map-marker-alt me-2" style={{ color: "#40C8FF", fontSize: "1rem" }}></i>
                <h6 className="card-title mb-0 fw-semibold" style={{ fontSize: "0.85rem" }}>Dispositivos</h6>
              </div>
              <p className="card-text fw-bold mb-1" style={{ color: "#40C8FF", fontSize: "clamp(1.1rem, 3.2vw, 1.6rem)" }}>{totalDevices}</p>
              <small className="text-muted">Activos en mapa</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 h-100 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.95) 100%)", backdropFilter: "blur(20px)", borderRadius: "15px" }}>
            <div className="card-body text-center py-2">
              <div className="d-flex align-items-center justify-content-center mb-1">
                <i className={`${currentMetric.icon} me-2`} style={{ color: "#2ECC71", fontSize: "1rem" }}></i>
                <h6 className="card-title mb-0 fw-semibold" style={{ fontSize: "0.85rem" }}>Promedio</h6>
              </div>
              <p className="card-text fw-bold mb-1" style={{ color: "#2ECC71", fontSize: "clamp(1.1rem, 3.2vw, 1.6rem)" }}>
                {avgValue.toFixed(1)}{currentMetric.unit}
              </p>
              <small className="text-muted">{getMetricLabel(avgValue.toFixed(1), selectedMetric)}</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 h-100 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.95) 100%)", backdropFilter: "blur(20px)", borderRadius: "15px" }}>
            <div className="card-body text-center py-2">
              <div className="d-flex align-items-center justify-content-center mb-1">
                <i className="fas fa-arrow-up me-2" style={{ color: "#E74C3C", fontSize: "1rem" }}></i>
                <h6 className="card-title mb-0 fw-semibold" style={{ fontSize: "0.85rem" }}>Máximo</h6>
              </div>
              <p className="card-text fw-bold mb-1" style={{ color: "#E74C3C", fontSize: "clamp(1.1rem, 3.2vw, 1.6rem)" }}>
                {getMetricValue(maxDevice, selectedMetric)}{currentMetric.unit}
              </p>
              <small className="text-muted">{maxDevice.device_id}</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 h-100 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,255,0.95) 100%)", backdropFilter: "blur(20px)", borderRadius: "15px" }}>
            <div className="card-body text-center py-2">
              <div className="d-flex align-items-center justify-content-center mb-1">
                <i className="fas fa-arrow-down me-2" style={{ color: "#3498DB", fontSize: "1rem" }}></i>
                <h6 className="card-title mb-0 fw-semibold" style={{ fontSize: "0.85rem" }}>Mínimo</h6>
              </div>
              <p className="card-text fw-bold mb-1" style={{ color: "#3498DB", fontSize: "clamp(1.1rem, 3.2vw, 1.6rem)" }}>
                {getMetricValue(minDevice, selectedMetric)}{currentMetric.unit}
              </p>
              <small className="text-muted">{minDevice.device_id}</small>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={contentRef} style={{ overflowX: "hidden" }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <div>
          <h6 className="fw-bold mb-1" style={{ color: "#1a1d29", fontSize: "clamp(1rem, 2.5vw, 1.1rem)" }}>
            <i className="fas fa-map-marked-alt me-2"></i>Mapa de Sensores Ambientales
          </h6>
          <p className="text-muted mb-0 small">
            Visualización geográfica de {currentMetric.label.toLowerCase()} en tiempo real
          </p>
        </div>
        {lastUpdate && (
          <div className="text-start text-md-end">
            <small className="text-muted d-block">
              <i className="fas fa-sync-alt me-1"></i>Última actualización:
            </small>
            <small className="fw-semibold" style={{ color: "#1a1d29" }}>
              {new Date(lastUpdate).toLocaleString("es-ES")}
            </small>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold mb-2" style={{ color: "#1a1d29" }}>
            <i className="fas fa-layer-group me-2"></i>Métrica a visualizar:
          </label>
          <select
            className="form-select border-0 shadow-sm"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            disabled={loading}
            style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)" }}
          >
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-6 d-grid d-md-flex align-items-md-end gap-2">
          <button
            className="btn btn-outline-primary btn-sm shadow-sm w-100 w-md-auto"
            onClick={exportToPDF}
            disabled={loading || data.length === 0}
          >
            <img src={pdfIcon} alt="PDF" width="16" height="16" className="me-1" />
            PDF
          </button>
          <button
            className="btn btn-outline-primary btn-sm shadow-sm w-100 w-md-auto"
            onClick={exportToCSV}
            disabled={loading || data.length === 0}
          >
            <img src={csvIcon} alt="CSV" width="16" height="16" className="me-1" />
            CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {renderDeviceInfo()}

      {/* Map Container */}
      <div className="card border-0 shadow-sm mb-3" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)", borderRadius: "15px" }}>
        <div className="card-body p-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary mb-2" role="status" style={{ width: "2rem", height: "2rem" }}>
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted">Cargando ubicaciones de sensores...</p>
            </div>
          ) : noDataMessage ? (
            <div className="alert alert-warning border-0 text-center py-3" style={{ background: "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)", borderRadius: "10px" }}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>{noDataMessage}</div>
            </div>
          ) : (
            <LoadScript googleMapsApiKey="AIzaSyAGDw-iXmwuHGCI_OZF6kLiCIckMNa1U8c">
              <GoogleMap
                onLoad={onMapLoad}
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={12}
                options={mapOptions}
              >
                {data.map((device, index) => {
                  const coordinates = parseCoordinates(device.location);
                  if (!coordinates) return null;
                  const position = { lat: coordinates[0], lng: coordinates[1] };
                  const metricValue = getMetricValue(device, selectedMetric);
                  const metricColor = getMetricColor(device, selectedMetric);

                  return (
                    <Marker
                      key={`${device.device_id}-${index}`}
                      position={position}
                      onClick={() => setSelectedMarker(device)}
                      icon={{
                        path: "M 0 0 m -10, 0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0",
                        fillColor: metricColor,
                        fillOpacity: 0.9,
                        strokeColor: "#ffffff",
                        strokeWeight: 3,
                        scale: isXS ? 1.2 : 1.6,
                        anchor: { x: 0, y: 0 },
                      }}
                    />
                  );
                })}

                {selectedMarker && (
                  <InfoWindow
                    position={{
                      lat: parseCoordinates(selectedMarker.location)[0],
                      lng: parseCoordinates(selectedMarker.location)[1],
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div style={{ padding: "10px", minWidth: isXS ? "180px" : "220px", maxWidth: "280px" }}>
                      <h6 className="fw-bold mb-2" style={{ color: "#1a1d29", fontSize: "clamp(0.9rem, 2.2vw, 1rem)" }}>
                        <i className="fas fa-microchip me-2"></i>
                        {selectedMarker.device_id}
                      </h6>
                      <div className="mb-2">
                        <strong
                          style={{
                            color:
                              currentMetric.icon === "fas fa-smog"
                                ? "#E74C3C"
                                : currentMetric.icon === "fas fa-thermometer-half"
                                ? "#E67E22"
                                : "#3498DB",
                          }}
                        >
                          {currentMetric.label}:
                        </strong>
                        <span className="ms-2">
                          {getMetricValue(selectedMarker, selectedMetric)}
                          {currentMetric.unit}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong>Estado:</strong>
                        <span className="ms-2" style={{ color: getMetricColor(selectedMarker, selectedMetric) }}>
                          {getMetricLabel(getMetricValue(selectedMarker, selectedMetric), selectedMetric)}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong>Ubicación:</strong>
                        <span className="ms-2 small text-muted">{selectedMarker.location}</span>
                      </div>
                      {selectedMarker.timestamp && (
                        <div>
                          <strong>Actualizado:</strong>
                          <span className="ms-2 small text-muted">
                            {new Date(selectedMarker.timestamp).toLocaleString("es-ES")}
                          </span>
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          )}
        </div>
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className="card border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)", borderRadius: "15px" }}>
          <div className="card-body p-3">
            <h6 className="fw-semibold mb-2 text-center" style={{ fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)" }}>
              <i className="fas fa-palette me-2"></i>
              Escala de {currentMetric.label}
            </h6>
            <div className="row text-center">
              {selectedMetric === "AQI" &&
                [
                  { range: "0-50", label: "Buena", color: "#00E676" },
                  { range: "51-100", label: "Moderada", color: "#FFD54F" },
                  { range: "101-150", label: "Dañina", color: "#FF8A65" },
                  { range: "151-200", label: "Mala", color: "#EF5350" },
                  { range: "201-300", label: "Muy mala", color: "#AB47BC" },
                  { range: "300+", label: "Peligrosa", color: "#8D6E63" },
                ].map((item, idx) => (
                  <div key={idx} className="col-6 col-md-2 mb-1">
                    <div
                      className="badge px-2 py-1 w-100"
                      style={{ backgroundColor: item.color, color: "white", fontSize: "0.7rem", fontWeight: "bold" }}
                    >
                      <div>{item.range}</div>
                      <div className="small">{item.label}</div>
                    </div>
                  </div>
                ))}

              {selectedMetric === "temperature" &&
                [
                  { range: "<15°C", label: "Frío", color: "#3498DB" },
                  { range: "15-25°C", label: "Agradable", color: "#2ECC71" },
                  { range: "25-30°C", label: "Cálido", color: "#F39C12" },
                  { range: "30-35°C", label: "Caliente", color: "#E67E22" },
                  { range: ">35°C", label: "Muy caliente", color: "#E74C3C" },
                ].map((item, idx) => (
                  <div key={idx} className="col-6 col-md-2 mb-1">
                    <div
                      className="badge px-2 py-1 w-100"
                      style={{ backgroundColor: item.color, color: "white", fontSize: "0.7rem", fontWeight: "bold" }}
                    >
                      <div>{item.range}</div>
                      <div className="small">{item.label}</div>
                    </div>
                  </div>
                ))}

              {selectedMetric === "humidity" &&
                [
                  { range: "<30%", label: "Muy seco", color: "#E74C3C" },
                  { range: "30-60%", label: "Confortable", color: "#2ECC71" },
                  { range: "60-80%", label: "Húmedo", color: "#F39C12" },
                  { range: ">80%", label: "Muy húmedo", color: "#3498DB" },
                ].map((item, idx) => (
                  <div key={idx} className="col-6 col-md-3 mb-1">
                    <div
                      className="badge px-2 py-1 w-100"
                      style={{ backgroundColor: item.color, color: "white", fontSize: "0.7rem", fontWeight: "bold" }}
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

export default SensorMap;
