const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

// Import your mongoose models
const SensorData = require("../models/SensorData"); 
const User = require("../models/User"); 

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

    const UNHEALTHY_AQI = 100; // Adjust as needed

    if (AQI > UNHEALTHY_AQI) {
      console.log(`AQI too high (${AQI}). Sending alerts...`);

      const alertUsers = await User.find({ alerts: true });

      if (alertUsers.length === 0) return console.log("No users to alert.");

      await Promise.all(
        alertUsers.map((user) =>
          sendEmail(
            user.email,
            "⚠️ Clarity App - Poor Air Quality Alert",
            `Hey, the current AQI level is ${AQI}, which exceeds healthy limits. Consider taking precautions.`
          )
        )
      );

    } else {
      console.log(`AQI is safe (${AQI}). No alerts sent.`);
    }
  } catch (error) {
    console.error("Error checking AQI and sending alerts:", error);
  }
};

module.exports = {
  checkAQIAndAlertUsers,
};
