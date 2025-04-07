import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BsDownload } from "react-icons/bs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfIcon from "../resources/pdf.png"; // Icono PDF
import csvIcon from "../resources/csv.png"; // Icono CSV
import logo from "../resources/CLAIRITYWHITE.png";

const AirQualityChart = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [filter, setFilter] = useState("day");
  const chartRef = useRef(null);
  const contentRef = useRef(null);

  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(`/api/sensors/history?filter=${filter}`);
        const data = await response.json();

        if (data.length === 0) {
          setNoDataMessage("No hay registros disponibles para el rango seleccionado. Por favor, cambie el filtro.");
          setHistoricalData([]); // Reset historical data if no records
          return;
        }

        setNoDataMessage(""); // Clear the message if data is found

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

  const getChartDescription = () => {
    const today = new Date().toLocaleDateString();
    const timeDesc = {
      hour: "la última hora",
      day: "el último día",
      week: "la última semana"
    }[filter];
    
    const avgAQI = historicalData.length > 0 
      ? (historicalData.reduce((sum, entry) => sum + entry.AQI, 0) / historicalData.length).toFixed(2)
      : "N/A";
      
    const maxAQI = historicalData.length > 0
      ? Math.max(...historicalData.map(entry => entry.AQI)).toFixed(2)
      : "N/A";
      
    return `Reporte de calidad del aire para ${timeDesc} generado el ${today}. AQI promedio: ${avgAQI}. AQI máximo: ${maxAQI}.`;
  };

  const downloadPDF = () => {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add logo
    html2canvas(document.createElement('img'), {
      onclone: (document, element) => {
        element.src = logo;
        element.width = 150;
        element.height = 40;
      }
    }).then(logoCanvas => {
      const logoData = logoCanvas.toDataURL('image/png');
      pdf.addImage(logoData, 'PNG', 10, 10, 50, 15);
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reporte de Calidad del Aire', pageWidth / 2, 18, { align: 'center' });
      
      // Add chart description
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const description = getChartDescription();
      pdf.text(description, 10, 30);
      
      // Add chart
      html2canvas(chartRef.current).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight);
        
        // Add data table
        pdf.setFontSize(10);
        pdf.text('Datos de la gráfica:', 10, imgHeight + 50);
        
        // Table headers
        pdf.setFont('helvetica', 'bold');
        pdf.text('Fecha/Hora', 10, imgHeight + 60);
        pdf.text('AQI', 60, imgHeight + 60);
        
        // Table rows
        pdf.setFont('helvetica', 'normal');
        historicalData.forEach((entry, index) => {
          const y = imgHeight + 65 + (index * 5);
          if (y < pageHeight - 20) { // Ensure we don't write off the page
            pdf.text(entry.timestamp.toString(), 10, y);
            pdf.text(entry.AQI.toFixed(2).toString(), 60, y);
          }
        });
        
        // Add footer with copyright
        pdf.setFontSize(8);
        pdf.text(`© Clairity ${new Date().getFullYear()} - Todos los derechos reservados`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        pdf.save('reporte_calidad_aire.pdf');
      });
    });
  };

  const downloadCSV = () => {
    // Create a more detailed CSV with headers and metadata
    const today = new Date().toLocaleDateString();
    const timeDesc = {
      hour: "última hora",
      day: "último día",
      week: "última semana"
    }[filter];
    
    const csvContent = 
      "# Reporte de Calidad del Aire - Clairity\n" +
      `# Generado: ${today}\n` +
      `# Periodo: ${timeDesc}\n` +
      "#\n" +
      "Timestamp,AQI\n" +
      historicalData.map(row => `${row.timestamp},${row.AQI.toFixed(2)}`).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `datos_calidad_aire_${filter}_${today.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4" ref={contentRef}>
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
            <span className="ms-2" style={{ fontSize: "1.1rem" }}>Descargar Reporte (PDF)</span>
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