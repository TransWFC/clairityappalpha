import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfIcon from "../resources/pdf.png"; // Icono PDF
import csvIcon from "../resources/csv.png"; // Icono CSV

const WeeklyAirQualityChart = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch("/api/sensors/history?filter=week");
        const data = await response.json();

        const groupedData = data.reduce((acc, entry) => {
          const date = new Date(entry.timestamp);
          const weekNumber = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
          
          if (!acc[weekNumber]) {
            acc[weekNumber] = { sum: 0, count: 0, week: weekNumber };
          }
          acc[weekNumber].sum += entry.AQI;
          acc[weekNumber].count += 1;
          return acc;
        }, {});

        const averagedData = Object.values(groupedData)
          .map(({ sum, count, week }) => ({
            timestamp: `Semana ${week % 52}`,
            AQI: sum / count,
          }))
          .slice(-4);

        setHistoricalData(averagedData);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };
    
    fetchHistoricalData();
  }, []);

  const downloadPDF = () => {
    html2canvas(chartRef.current).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 100);
      pdf.save("weekly_air_quality_chart.pdf");
    });
  };

  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Timestamp,AQI\n" +
      historicalData.map(row => `${row.timestamp},${row.AQI}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "weekly_air_quality_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="fw-bold">Promedio de AQI durante el mes</h2>
      <div className="bg-white p-4 rounded-4 shadow-sm">
        {/* Icono para descargar PDF */}
        <div className="mb-2" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={pdfIcon}
            alt="Descargar PDF"
            onClick={downloadPDF}
            style={{ width: "40px", cursor: "pointer" }}
          />
          <span className="ms-2" style={{ fontSize: "1.1rem" }}>Descargar Gráfica (PDF)</span>
        </div>

        {/* Icono para descargar CSV */}
        <div className="mb-2" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={csvIcon}
            alt="Descargar CSV"
            onClick={downloadCSV}
            style={{ width: "40px", cursor: "pointer" }}
          />
          <span className="ms-2" style={{ fontSize: "1.1rem" }}>Descargar Datos (CSV)</span>
        </div>

        <div ref={chartRef}>
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
  );
};

export default WeeklyAirQualityChart;
