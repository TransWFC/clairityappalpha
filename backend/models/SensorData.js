  const mongoose = require("mongoose");

  const SensorDataSchema = new mongoose.Schema({
    device_id: { type: String, required: true }, // Unique string identifier
    location: { type: String, required: true }, // e.g., "uteq"
    status: { type: String, enum: ["activo", "inactivo"], required: true },
    temperature: Number,
    humidity: Number,
    CO2: Number,
    TVOC: Number,
    PM1: Number,
    PM2: Number,
    PM10: Number,
    CO: Number,
    AQI: Number,
    timestamp: { type: Date, default: Date.now },
  });

  module.exports = mongoose.model("SensorData", SensorDataSchema);