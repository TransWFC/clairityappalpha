const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

// Importar los modelos de mongoose
const SensorData = require("../models/SensorData");
const User = require("../models/User");

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (email, subject, text) => {
  const info = await transporter.sendMail({
    from: `"Clarity App 👁️‍🗨️" <${process.env.MAIL_FROM}>`,
    to: email,
    subject,
    text,
  });

  console.log(`Alert sent to ${email}:`, info.response);
};

const checkAQIAndAlertUsers = async () => {
  try {
    const latestSensor = await SensorData.findOne().sort({ createdAt: -1 });

    if (!latestSensor) return console.log("No sensor data found.");

    const { AQI } = latestSensor;

    const UNHEALTHY_AQI = 100; // Ajusta según lo que consideres como "no saludable"

    if (AQI > UNHEALTHY_AQI) {
      console.log(`AQI demasiado alto (${AQI}). Enviando alertas...`);

      const alertUsers = await User.find({ alerts: true });

      if (alertUsers.length === 0) return console.log("No hay usuarios a los que alertar.");

      await Promise.all(
        alertUsers.map((user) =>
          sendEmail(
            user.email,
            "⚠️ Clarity App - Alerta de Calidad del Aire",
            `Hola, el nivel actual de AQI es ${AQI}, lo cual excede los límites saludables. Considera tomar precauciones.`
          )
        )
      );

    } else {
      console.log(`AQI está en niveles seguros (${AQI}). No se enviaron alertas.`);
    }
  } catch (error) {
    console.error("Error al verificar AQI y enviar alertas:", error);
  }
};

// Ejecutar la función
checkAQIAndAlertUsers();
