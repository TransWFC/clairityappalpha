const nodemailer = require("nodemailer");
const crypto = require("crypto");

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString(); // Generar un código aleatorio de 6 dígitos
};

const sendVerificationCode = async (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g. email-smtp.us-east-2.amazonaws.com
    port: 465, // SSL (or 587 for TLS)
    secure: true, // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER, // AWS SES SMTP Username
      pass: process.env.SMTP_PASS, // AWS SES SMTP Password
    },
  });

  const info = await transporter.sendMail({
    from: `"Clarity App 👁️‍🗨️" <${process.env.MAIL_FROM}>`, // Recommended: domain email verified in SES
    to: email,
    subject: "Código de verificación Clarity",
    text: `Tu código de verificación es: ${verificationCode}`,
  });

  console.log("Correo enviado:", info.response);
};

module.exports = { generateVerificationCode, sendVerificationCode };
