const express = require("express");
const SensorData = require("../models/SensorData");
const router = express.Router();

let lastSavedTime = 0;
let latestReading = null;

router.post("/send", async (req, res) => {
  try {
    console.log("📩 Received sensor data:", req.body);
    const {
      device_id, location, status,
      temperature, humidity,
      PM1, PM2, PM10, AQI
    } = req.body;

    if (!device_id || !location || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Guardar la lectura más reciente en memoria
    latestReading = {
      device_id, location, status,
      temperature, humidity,
      PM1, PM2, PM10, AQI,
      timestamp: new Date()
    };

    const now = new Date();
    const minutes = now.getMinutes();
    const validMinutes = [0, 15, 30, 45];

    // Use rounded time (minute precision) as unique key
    const timeKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${Math.floor(minutes / 15)}`;

    if (!global.lastTimeKey || global.lastTimeKey !== timeKey) {
      // Save only once per valid quarter-hour
      if (validMinutes.includes(minutes)) {
        const sensorData = new SensorData(latestReading);
        await sensorData.save();
        global.lastTimeKey = timeKey;
        console.log("✅ Sensor data saved to DB at minute:", minutes);
      } else {
        console.log("🕒 Not a scheduled save minute:", minutes);
      }
    } else {
      console.log("💾 Skipping DB save (already saved this time block)");
    }

    res.status(200).json({ message: "Sensor data received" });
  } catch (error) {
    console.error("❌ Error handling sensor data:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get("/latest", (req, res) => {
  if (latestReading) {
    return res.json(latestReading);
  } else {
    return res.status(404).json({ error: "No data available yet" });
  }
});

router.get("/devices", async (req, res) => {
  try {
    console.log("📤 Fetching device list...");
    const devices = await SensorData.distinct("device_id");
    res.json(devices);
  } catch (error) {
    console.error("❌ Error fetching devices:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/get", async (req, res) => {
  try {
    console.log("📤 Fetching recent sensor data...");
    const data = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(1000);
    
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching sensor data:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/history", async (req, res) => {
  try {
    console.log("📤 Fetching historical sensor data...");

    let { filter = "day", device = "all" } = req.query;
    console.log(`Filter: ${filter}, Device: ${device}`);

    const now = new Date();
    let startDate, aggregationPipeline;

    // Build match criteria
    const baseMatch = {};
    if (device !== "all") {
      baseMatch.device_id = device;
    }

    switch (filter) {
      case "hour":
        // Last hour - individual records
        startDate = new Date(now.getTime() - (60 * 60 * 1000));
        aggregationPipeline = [
          { 
            $match: { 
              ...baseMatch,
              timestamp: { $gte: startDate, $lte: now }
            }
          },
          {
            $project: {
              timestamp: 1,
              AQI: 1
            }
          },
          { $sort: { timestamp: 1 } }
        ];
        break;

      case "day":
        // Last 24 hours - hourly averages (24 points max)
        startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        aggregationPipeline = [
          { 
            $match: { 
              ...baseMatch,
              timestamp: { $gte: startDate, $lte: now }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { 
                  format: "%Y-%m-%d-%H",
                  date: "$timestamp",
                  timezone: "America/Mexico_City"
                }
              },
              averageAQI: { $avg: "$AQI" },
              count: { $sum: 1 },
              date: { $first: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "America/Mexico_City" } } },
              hour: { $first: { $dateToString: { format: "%H:00", date: "$timestamp", timezone: "America/Mexico_City" } } }
            }
          },
          { $sort: { _id: 1 } }
        ];
        break;

      case "week":
        // Last 7 days - daily averages (7 points max)
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        aggregationPipeline = [
          { 
            $match: { 
              ...baseMatch,
              timestamp: { $gte: startDate, $lte: now }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { 
                  format: "%Y-%m-%d",
                  date: "$timestamp",
                  timezone: "America/Mexico_City"
                }
              },
              averageAQI: { $avg: "$AQI" },
              count: { $sum: 1 },
              date: { $first: "$_id" }
            }
          },
          { $sort: { _id: 1 } }
        ];
        break;

      case "month":
        // Last 30 days - daily averages (30 points max)
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        aggregationPipeline = [
          { 
            $match: { 
              ...baseMatch,
              timestamp: { $gte: startDate, $lte: now }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { 
                  format: "%Y-%m-%d",
                  date: "$timestamp",
                  timezone: "America/Mexico_City"
                }
              },
              averageAQI: { $avg: "$AQI" },
              count: { $sum: 1 },
              date: { $first: "$_id" }
            }
          },
          { $sort: { _id: 1 } }
        ];
        break;

      case "year":
        // Current year - monthly averages (12 points max)
        const yearStart = new Date(now.getFullYear(), 0, 1);
        startDate = yearStart;
        aggregationPipeline = [
          { 
            $match: { 
              ...baseMatch,
              timestamp: { $gte: startDate, $lte: now }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { 
                  format: "%Y-%m",
                  date: "$timestamp",
                  timezone: "America/Mexico_City"
                }
              },
              averageAQI: { $avg: "$AQI" },
              count: { $sum: 1 },
              month: { $first: "$_id" }
            }
          },
          { $sort: { _id: 1 } }
        ];
        break;

      default:
        return res.status(400).json({ error: "Invalid filter type" });
    }

    console.log(`Querying from ${startDate.toISOString()} to ${now.toISOString()}`);

    // Execute aggregation
    const results = await SensorData.aggregate(aggregationPipeline);
    console.log(`Found ${results.length} aggregated records`);

    // Format the response data based on filter type
    let data;
    
    if (filter === "hour") {
      // Individual records for last hour
      data = results.map(entry => ({
        timestamp: entry.timestamp,
        AQI: Math.round(entry.AQI * 100) / 100
      }));
    } else {
      // Aggregated data for other filters
      data = results.map(entry => {
        const formattedEntry = {
          averageAQI: Math.round(entry.averageAQI * 100) / 100,
          count: entry.count
        };

        // Add appropriate time field based on filter
        if (filter === "day") {
          formattedEntry.date = entry.date;
          formattedEntry.hour = entry.hour;
        } else if (filter === "week" || filter === "month") {
          formattedEntry.date = entry._id;
        } else if (filter === "year") {
          formattedEntry.month = entry._id;
        }

        return formattedEntry;
      });
    }

    // Check if we have data
    if (data.length === 0) {
      console.log("No data found for the given criteria");
      return res.status(404).json({ 
        message: "No historical data found for the given range",
        filter,
        device,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      });
    }

    // Return successful response
    res.json({
      data,
      filter,
      device,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totalRecords: data.length,
      lastUpdate: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Error processing historical sensor data:", error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get("/stats", async (req, res) => {
  try {
    console.log("📤 Fetching current statistics...");
    
    const { device = "all" } = req.query;
    const match = {};
    
    if (device !== "all") {
      match.device_id = device;
    }

    // Get latest readings (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    match.timestamp = { $gte: tenMinutesAgo };

    const stats = await SensorData.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          currentAQI: { $avg: "$AQI" },
          minAQI: { $min: "$AQI" },
          maxAQI: { $max: "$AQI" },
          deviceCount: { $addToSet: "$device_id" },
          recordCount: { $sum: 1 },
          lastReading: { $max: "$timestamp" },
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(404).json({ 
        message: "No recent data available",
        timeframe: "last 10 minutes"
      });
    }

    const result = stats[0];
    
    res.json({
      currentAQI: Math.round(result.currentAQI * 100) / 100,
      minAQI: Math.round(result.minAQI * 100) / 100,
      maxAQI: Math.round(result.maxAQI * 100) / 100,
      activeDevices: result.deviceCount.length,
      recordCount: result.recordCount,
      lastReading: result.lastReading,
      timeframe: "last 10 minutes"
    });

  } catch (error) {
    console.error("❌ Error fetching statistics:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;