require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensors");
const recommendationsRoute = require("./routes/recommendations");
const groupsRoute = require("./routes/groups");
const userRoutes = require("./routes/users");  // Importa las rutas de usuarios

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use("/recommendations", recommendationsRoute);
app.use("/groups", groupsRoute);
app.use("/users", userRoutes);  // Aquí agregas las rutas de usuarios

app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(r.route.path);
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
