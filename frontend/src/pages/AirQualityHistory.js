import React, { useState, useRef, useEffect } from "react";
import { Chart } from "chart.js/auto";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "../index.css";

const AirQualityHistory = () => {
  // Datos ficticios
  const historyData = [
    {
      date: "2025-03-01T08:00:00",
      PM25: 12,
      PM10: 20,
      CO: 1.2,
      temperature: 22.5,
      humidity: 45,
      pressure: 1013,
    },
    {
      date: "2025-03-01T12:00:00",
      PM25: 15,
      PM10: 25,
      CO: 1.5,
      temperature: 23.0,
      humidity: 50,
      pressure: 1012,
    },
    {
      date: "2025-03-01T16:00:00",
      PM25: 30,
      PM10: 40,
      CO: 2.0,
      temperature: 24.5,
      humidity: 55,
      pressure: 1011,
    },
    {
      date: "2025-03-02T09:00:00",
      PM25: 50,
      PM10: 60,
      CO: 2.5,
      temperature: 25.0,
      humidity: 60,
      pressure: 1010,
    },
    {
      date: "2025-03-02T14:00:00",
      PM25: 10,
      PM10: 15,
      CO: 1.0,
      temperature: 21.0,
      humidity: 40,
      pressure: 1014,
    },
  ];

  // Estados
  const [filteredData, setFilteredData] = useState(historyData);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([
    "PM25",
    "PM10",
    "CO",
    "temperature",
    "humidity",
    "pressure",
  ]);
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  // Función para manejar la selección de columnas
  const handleColumnSelection = (column) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter((col) => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  // Función para aplicar los filtros
  const handleFilter = () => {
    let filtered = historyData;

    if (startDate && endDate) {
      filtered = filtered.filter((data) => {
        const date = new Date(data.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }

    if (startTime && endTime) {
      filtered = filtered.filter((data) => {
        const hour = new Date(data.date).getHours();
        return hour >= parseInt(startTime) && hour <= parseInt(endTime);
      });
    }

    setFilteredData(filtered);
  };

  // Función para renderizar el gráfico
  const renderChart = () => {
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    const labels = filteredData.map((data) => new Date(data.date).toLocaleString());
    const datasets = selectedColumns.map((column) => ({
      label: column,
      data: filteredData.map((data) => data[column]),
      borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      fill: false,
    }));

    const newChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
      },
    });

    setChartInstance(newChart);
  };

  useEffect(() => {
    if (filteredData.length > 0) {
      renderChart();
    }
  }, [filteredData, selectedColumns]);

  // Función para exportar la tabla a PDF
  const exportTableToPDF = () => {
    const doc = new jsPDF();
  
    // Encabezados de la tabla
    const headers = ["Fecha y Hora", ...selectedColumns.map((col) => col)];
  
    // Datos de la tabla
    const data = filteredData.map((row) => [
      new Date(row.date).toLocaleString(),
      ...selectedColumns.map((col) => row[col]),
    ]);
  
    // Generar la tabla
    doc.autoTable({
      head: [headers],
      body: data,
    });
  
    // Guardar el PDF
    doc.save("historico_calidad_aire.pdf");
  };

  // Función para exportar el gráfico a PDF
  const exportChartToPDF = () => {
    const doc = new jsPDF();
    const chartImage = chartRef.current.toDataURL("image/png");
    doc.addImage(chartImage, "PNG", 10, 10, 180, 100);
    doc.save("grafico_calidad_aire.pdf");
  };

  return (
    <div className="home-container">
      <div className="content">
        <h1 className="text-3xl font-bold">Histórico de Calidad del Aire</h1>
        <p className="tagline">
          Consulta el historial de calidad del aire y selecciona los datos a mostrar.
        </p>

        {/* Filtros */}
        <div className="filters">
          <div className="filter-item">
            <label htmlFor="startDate" className="filter-label">Desde:</label>
            <input
              type="date"
              id="startDate"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="endDate" className="filter-label">Hasta:</label>
            <input
              type="date"
              id="endDate"
              className="input-field"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="startTime" className="filter-label">Hora de inicio:</label>
            <input
              type="time"
              id="startTime"
              className="input-field"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="endTime" className="filter-label">Hora de fin:</label>
            <input
              type="time"
              id="endTime"
              className="input-field"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="filter-item column-selector">
            <label className="filter-label">Mostrar columnas:</label>
            <div className="column-buttons">
              {["PM25", "PM10", "CO", "temperature", "humidity", "pressure"].map((column) => (
                <button
                  key={column}
                  className={`column-button ${selectedColumns.includes(column) ? "active" : ""}`}
                  onClick={() => handleColumnSelection(column)}
                >
                  {column}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleFilter} className="btn">Aplicar Filtros</button>
        </div>

        {/* Exportar a PDF */}
        <div className="export-buttons">
          <button onClick={exportTableToPDF} className="btn">Exportar Tabla a PDF</button>
          <button onClick={exportChartToPDF} className="btn">Exportar Gráfico a PDF</button>
        </div>

        {/* Gráfico */}
        <div className="chart-container">
          <canvas ref={chartRef}></canvas>
        </div>

        {/* Tabla */}
        <div className="history-table">
          <table>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                {selectedColumns.includes("PM25") && <th>PM2.5</th>}
                {selectedColumns.includes("PM10") && <th>PM10</th>}
                {selectedColumns.includes("CO") && <th>CO (ppm)</th>}
                {selectedColumns.includes("temperature") && <th>Temperatura (°C)</th>}
                {selectedColumns.includes("humidity") && <th>Humedad (%)</th>}
                {selectedColumns.includes("pressure") && <th>Presión (hPa)</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={selectedColumns.length + 1}>No se encontraron resultados para los filtros aplicados.</td>
                </tr>
              ) : (
                filteredData.map((data, index) => (
                  <tr key={index}>
                    <td>{new Date(data.date).toLocaleString()}</td>
                    {selectedColumns.includes("PM25") && <td>{data.PM25}</td>}
                    {selectedColumns.includes("PM10") && <td>{data.PM10}</td>}
                    {selectedColumns.includes("CO") && <td>{data.CO}</td>}
                    {selectedColumns.includes("temperature") && <td>{data.temperature}</td>}
                    {selectedColumns.includes("humidity") && <td>{data.humidity}</td>}
                    {selectedColumns.includes("pressure") && <td>{data.pressure}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AirQualityHistory;