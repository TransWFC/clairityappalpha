const nodemailer = require("nodemailer");
const crypto = require("crypto");

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const sendVerificationCode = async (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Usa Gmail como servicio
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Clairity App" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Código de verificación Clairity",
    text: `Tu código de verificación es: ${verificationCode}`,
  });

  console.log("Correo enviado:", info.response);
};

module.exports = { generateVerificationCode, sendVerificationCode };
