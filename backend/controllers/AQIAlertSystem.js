const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

// Importar los modelos de mongoose
const SensorData = require("../models/SensorData");
const User = require("../models/User");

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Transporter usando Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendEmail = async (email, subject, text) => {
  const info = await transporter.sendMail({
    from: `"Clarity App 👁️‍🗨️" <${process.env.GMAIL_USER}>`,
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

    const { AQI, alertSent } = latestSensor;

    const UNHEALTHY_AQI = 10; // Límite AQI

    if (AQI > UNHEALTHY_AQI && !alertSent) {
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

      // Marcar el registro como ya alertado
      latestSensor.alertSent = true;
      await latestSensor.save();

    } else if (AQI > UNHEALTHY_AQI && alertSent) {
      console.log(`AQI sigue alto (${AQI}), pero alerta ya enviada para este registro.`);
    } else {
      console.log(`AQI está en niveles seguros (${AQI}). No se enviaron alertas.`);
    }

  } catch (error) {
    console.error("Error al verificar AQI y enviar alertas:", error);
  }
};

// Ejecutar la función
checkAQIAndAlertUsers();
