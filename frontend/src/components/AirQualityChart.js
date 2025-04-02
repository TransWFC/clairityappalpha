import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BsDownload } from "react-icons/bs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfIcon from "../resources/pdf.png"; // Icono PDF
import csvIcon from "../resources/csv.png"; // Icono CSV

const AirQualityChart = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [filter, setFilter] = useState("day");
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(`/api/sensors/history?filter=${filter}`);
        const data = await response.json();

        if (filter === "week") {
          const groupedData = data.reduce((acc, entry) => {
            const date = new Date(entry.timestamp).toISOString().split("T")[0];
            if (!acc[date]) {
              acc[date] = { sum: 0, count: 0, date };
            }
            acc[date].sum += entry.AQI;
            acc[date].count += 1;
            return acc;
          }, {});

          const averagedData = Object.values(groupedData).map(({ sum, count, date }) => ({
            timestamp: date,
            AQI: sum / count,
          })).slice(-7);

          setHistoricalData(averagedData);
        } else if (filter === "day") {
          const groupedData = data.reduce((acc, entry) => {
            const hour = new Date(entry.timestamp).getHours();
            if (!acc[hour]) {
              acc[hour] = { sum: 0, count: 0, hour };
            }
            acc[hour].sum += entry.AQI;
            acc[hour].count += 1;
            return acc;
          }, {});

          const averagedData = Object.values(groupedData).map(({ sum, count, hour }) => ({
            timestamp: `${hour}:00`,
            AQI: sum / count,
          }));

          setHistoricalData(averagedData);
        } else {
          setHistoricalData(data);
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };
    fetchHistoricalData();
  }, [filter]);

  const downloadPDF = () => {
    html2canvas(chartRef.current).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 100);
      pdf.save("air_quality_chart.pdf");
    });
  };

  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Timestamp,AQI\n" +
      historicalData.map(row => `${row.timestamp},${row.AQI}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "air_quality_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row align-items-start">
        <div className="col-md-3 d-flex flex-column align-items-start">
          <h2 className="fw-bold">Evolución en la calidad del aire</h2>
          <label className="mt-2 fw-semibold">Mostrar por:</label>
          <select className="form-select mt-1" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="hour">Última hora</option>
            <option value="day">Último día</option>
            <option value="week">Última semana</option>
          </select>

          {/* Icono para descargar PDF */}
          <div className="mt-3" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={pdfIcon}
              alt="Descargar PDF"
              onClick={downloadPDF}
              style={{ width: "40px", cursor: "pointer" }}
            />
            <span className="ms-2" style={{ fontSize: "1.1rem" }}>Descargar Gráfica (PDF)</span>
          </div>

          {/* Icono para descargar CSV */}
          <div className="mt-2" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={csvIcon}
              alt="Descargar CSV"
              onClick={downloadCSV}
              style={{ width: "40px", cursor: "pointer" }}
            />
            <span className="ms-2" style={{ fontSize: "1.1rem" }}>Descargar Datos (CSV)</span>
          </div>
        </div>

        <div className="col-md-8 position-relative">
          <div ref={chartRef} className="bg-white p-4 rounded-4 shadow-sm position-relative">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis label={{ value: "AQI", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Line type="monotone" dataKey="AQI" stroke="#40C8FF" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityChart;
