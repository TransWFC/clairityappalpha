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
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit if database connection fails
  });

// Security and middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Optional: Add debug middleware only in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (req.url.includes('/api/users')) {
      console.log(`🔍 ${req.method} ${req.url}`, req.body ? 'with body' : 'no body');
    }
    next();
  });
}

// Error handling middleware for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', err.message);
    return res.status(400).json({ 
      message: 'Invalid JSON format', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Bad Request'
    });
  }
  next(err);
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/recommendations", recommendationsRoute);
app.use("/api/groups", groupsRoute);
app.use("/api/users", userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

// CRON JOBS
if (process.env.NODE_ENV === 'production') {
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
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  });
});