const express = require("express");
const SensorData = require("../models/SensorData");
const router = express.Router();

router.post("/send", async (req, res) => {
  try {
    console.log("📩 Received sensor data:", req.body);
    const { device_id, location, status, temperature, humidity, CO2, TVOC, PM1, PM2, PM10, CO, AQI } = req.body;
    
    if (!device_id || !location || !status) {
      return res.status(400).json({ error: "Missing required fields: device_id, location, or status" });
    }

    const sensorData = new SensorData({
      device_id,
      location,
      status,
      temperature,
      humidity,
      CO2,
      TVOC,
      PM1,
      PM2,
      PM10,
      CO,
      AQI,
    });
    
    await sensorData.save();
    console.log("✅ Sensor data saved successfully");
    res.status(201).json({ message: "Sensor data saved successfully" });
  } catch (error) {
    console.error("❌ Error saving sensor data:", error);
    res.status(500).json({ error: error.message });
  }
});

// recent sensor data
router.get("/get", async (req, res) => {
  try {
    console.log("📤 Fetching sensor data...");
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching sensor data:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route handler for historical sensor data
router.get("/history", async (req, res) => {
  try {
    console.log("📤 Fetching historical sensor data...");
    
    let { startDate, endDate, filter } = req.query;
    
    const now = new Date();
    if (!filter) filter = "day"; // Default filter
    
    // Set time range based on filter
    switch (filter) {
      case "hour":
        startDate = new Date(now.setHours(now.getHours() - 1)).toISOString();
        break;
      case "day":
        startDate = new Date(now.setDate(now.getDate() - 1)).toISOString();
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      default:
        return res.status(400).json({ 
          error: "Invalid filter type", 
          message: "El tipo de filtro especificado no es válido. Use 'hour', 'day', o 'week'." 
        });
    }
    
    endDate = new Date().toISOString();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const query = { timestamp: { $gte: start, $lte: end } };
    const data = await SensorData.find(query).sort({ timestamp: 1 }).limit(1000);
    
    // Return an empty array with 200 status instead of 404 when no data is found
    // This lets the frontend handle the "no data" display logic
    return res.status(200).json(data);
    
  } catch (error) {
    console.error("❌ Error fetching historical sensor data:", error);
    res.status(500).json({ 
      error: error.message,
      message: "Error al obtener datos históricos. Por favor, intente más tarde."
    });
  }
});



module.exports = router;