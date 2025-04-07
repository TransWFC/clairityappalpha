const nodemailer = require("nodemailer");
const crypto = require("crypto");

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString(); // Generar un código aleatorio de 6 dígitos
};

const sendVerificationCode = async (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Usa un servicio de correo adecuado
    auth: {
      user: process.env.GMAIL_USER, // Define tu correo en el .env
      pass: process.env.GMAIL_PASS, // Define tu contraseña en el .env
    },
  });

  const info = await transporter.sendMail({
    from: `"Clarity App" <${process.env.GMAIL_USER}>`, // Dirección del remitente
    to: email, // Dirección del destinatario
    subject: "Código de verificación Clarity",
    text: `Tu código de verificación es: ${verificationCode}`,
  });

  console.log("Correo enviado:", info.response);
};

module.exports = { generateVerificationCode, sendVerificationCode };
