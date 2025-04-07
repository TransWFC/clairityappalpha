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

router.get("/history", async (req, res) => {
  try {
    console.log("📤 Fetching historical sensor data...");

    let { startDate, endDate, filter } = req.query;

    const now = new Date();
    if (!filter) filter = "day"; // Filtro por defecto

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
        return res.status(400).json({ error: "Invalid filter type" });
    }
    endDate = new Date().toISOString();

    const start = new Date(startDate);
    const end = new Date(endDate);

    const query = { timestamp: { $gte: start, $lte: end } };
    const data = await SensorData.find(query).sort({ timestamp: 1 }).limit(1000);

    if (data.length === 0) {
      return res.status(404).json({ message: "No historical data found for the given range" });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching historical sensor data:", error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;