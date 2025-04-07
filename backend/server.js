require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");

const AQIAlertSystem = require("./AQIAlertSystem");
const AQIForecastSystem = require("./AQIForecastSystem");

const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensors");
const recommendationsRoute = require("./routes/recommendations");
const groupsRoute = require("./routes/groups");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/recommendations", recommendationsRoute);
app.use("/api/groups", groupsRoute);
app.use("/api/users", userRoutes);

// Mostrar rutas activas
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});

// CRON JOBS

// Forecast diario 10 AM CDMX
cron.schedule('0 10 * * *', () => {
  console.log('⏰ Ejecutando Forecast Diario de AQI...');
  AQIForecastSystem();
}, {
  timezone: 'America/Mexico_City'
});

// Alertas cada hora
cron.schedule('0 * * * *', () => {
  console.log('⏰ Ejecutando Sistema de Alertas de AQI...');
  AQIAlertSystem();
}, {
  timezone: 'America/Mexico_City'
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
