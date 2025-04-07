import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pdfIcon from "../resources/pdf.png"; // Icono PDF
import csvIcon from "../resources/csv.png"; // Icono CSV
import logo from "../resources/CLAIRITYWHITE.png";

const WeeklyAirQualityChart = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [noDataMessage, setNoDataMessage] = useState("");
  const chartRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setNoDataMessage(""); // Clear any previous message
        const response = await fetch("/api/sensors/history?filter=week");
        
        if (!response.ok) {
          if (response.status === 404) {
            setNoDataMessage("No hay datos disponibles para el período mensual. Por favor, intente más tarde cuando haya más registros.");
            setHistoricalData([]);
            return;
          }
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();

        if (data.length === 0) {
          setNoDataMessage("No hay registros disponibles para el período mensual. Por favor, intente más tarde cuando haya más registros.");
          setHistoricalData([]);
          return;
        }

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

        if (averagedData.length === 0) {
          setNoDataMessage("No hay suficientes datos para mostrar el promedio mensual. Por favor, intente más tarde.");
          setHistoricalData([]);
          return;
        }

        setHistoricalData(averagedData);
      } catch (error) {
        console.error("Error fetching historical data:", error);
        setNoDataMessage("Error al cargar datos. Por favor, intente más tarde.");
      }
    };
    
    fetchHistoricalData();
  }, []);

  const getChartDescription = () => {
    const today = new Date().toLocaleDateString();
    
    const avgAQI = historicalData.length > 0 
      ? (historicalData.reduce((sum, entry) => sum + entry.AQI, 0) / historicalData.length).toFixed(2)
      : "N/A";
      
    const maxAQI = historicalData.length > 0
      ? Math.max(...historicalData.map(entry => entry.AQI)).toFixed(2)
      : "N/A";
      
    const minAQI = historicalData.length > 0
      ? Math.min(...historicalData.map(entry => entry.AQI)).toFixed(2)
      : "N/A";
      
    const trend = historicalData.length > 1
      ? historicalData[historicalData.length - 1].AQI > historicalData[0].AQI
        ? "creciente"
        : "decreciente"
      : "estable";
    
    return `Reporte mensual de calidad del aire generado el ${today}. AQI promedio: ${avgAQI}. AQI máximo: ${maxAQI}. AQI mínimo: ${minAQI}. Tendencia: ${trend}.`;
  };

  const downloadPDF = () => {
    if (historicalData.length === 0) {
      alert("No hay datos disponibles para generar el PDF.");
      return;
    }
    
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
      pdf.text('Reporte Mensual de Calidad del Aire', pageWidth / 2, 18, { align: 'center' });
      
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
        pdf.text('Semana', 10, imgHeight + 60);
        pdf.text('AQI Promedio', 60, imgHeight + 60);
        
        // Table rows
        pdf.setFont('helvetica', 'normal');
        historicalData.forEach((entry, index) => {
          const y = imgHeight + 65 + (index * 5);
          if (y < pageHeight - 20) { // Ensure we don't write off the page
            pdf.text(entry.timestamp.toString(), 10, y);
            pdf.text(entry.AQI.toFixed(2).toString(), 60, y);
          }
        });
        
        // Add interpretation section
        const avgAQI = historicalData.length > 0 
          ? (historicalData.reduce((sum, entry) => sum + entry.AQI, 0) / historicalData.length).toFixed(2)
          : "N/A";
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Interpretación:', 10, imgHeight + 90);
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Este informe muestra el promedio semanal de calidad del aire (AQI) durante el último mes.`, 10, imgHeight + 100);
        pdf.text(`El AQI promedio para este período es de ${avgAQI}.`, 10, imgHeight + 110);
        
        // Add footer with copyright
        pdf.setFontSize(8);
        pdf.text(`© Clairity ${new Date().getFullYear()} - Todos los derechos reservados`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        pdf.save('reporte_mensual_calidad_aire.pdf');
      });
    });
  };

  const downloadCSV = () => {
    if (historicalData.length === 0) {
      alert("No hay datos disponibles para descargar el CSV.");
      return;
    }
    
    // Create a more detailed CSV with headers and metadata
    const today = new Date().toLocaleDateString();
    const monthName = new Date().toLocaleString('es-ES', { month: 'long' });
    
    const csvContent = 
      "# Reporte Mensual de Calidad del Aire - Clairity\n" +
      `# Mes: ${monthName}\n` +
      `# Generado: ${today}\n` +
      "#\n" +
      "Semana,AQI_Promedio\n" +
      historicalData.map(row => `${row.timestamp},${row.AQI.toFixed(2)}`).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `datos_mensuales_calidad_aire_${monthName}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4" ref={contentRef}>
      <h2 className="fw-bold">Promedio de AQI durante el mes</h2>
      <div className="bg-white p-4 rounded-4 shadow-sm">
        {/* Iconos para descargar */}
        <div className="row mb-3">
          {/* Icono para descargar PDF */}
          <div className="col-md-6 mb-2" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={pdfIcon}
              alt="Descargar PDF"
              onClick={downloadPDF}
              style={{ 
                width: "40px", 
                cursor: historicalData.length > 0 ? "pointer" : "not-allowed", 
                opacity: historicalData.length > 0 ? 1 : 0.5 
              }}
            />
            <span className="ms-2" style={{ fontSize: "1.1rem" }}>Descargar Reporte (PDF)</span>
          </div>

          {/* Icono para descargar CSV */}
          <div className="col-md-6 mb-2" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={csvIcon}
              alt="Descargar CSV"
              onClick={downloadCSV}
              style={{ 
                width: "40px", 
                cursor: historicalData.length > 0 ? "pointer" : "not-allowed", 
                opacity: historicalData.length > 0 ? 1 : 0.5 
              }}
            />
            <span className="ms-2" style={{ fontSize: "1.1rem" }}>Descargar Datos (CSV)</span>
          </div>
        </div>

        <div ref={chartRef}>
          {noDataMessage ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
              <div className="text-center">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {noDataMessage}
                </div>
                <p>Para ver los datos recientes, consulte la gráfica de evolución de calidad del aire.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = "/dashboard"}
                >
                  Ir al Panel Principal
                </button>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis label={{ value: "AQI", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Line type="monotone" dataKey="AQI" stroke="#40C8FF" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyAirQualityChart;