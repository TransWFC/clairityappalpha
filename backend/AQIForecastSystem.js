const axios = require('axios');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelo de usuario
const User = require('./models/User');

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Transporter usando Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Traer los datos de calidad de aire
const fetchAQIData = async () => {
  try {
    const response = await axios.get('http://13.59.161.219:8000/api/calidad-aire');
    return response.data;
  } catch (error) {
    console.error('Error fetching AQI data:', error);
    return null;
  }
};

// Construir contenido del email
const buildEmailContent = (data) => {
  if (!data) return 'No se pudo obtener información del AQI.';

  let content = `<h1>Reporte Diario de Calidad del Aire (AQI)</h1>`;
  
  Object.keys(data).forEach(city => {
    if (data[city].forecast?.dates) {
      content += `<h2>${city.toUpperCase()}</h2><ul>`;
      data[city].forecast.dates.forEach((date, i) => {
        content += `<li>${date} → PM2.5: ${data[city].forecast.combined[i]}</li>`;
      });
      content += `</ul>`;
    }
  });

  return content;
};

// Enviar mail individual
const sendEmail = async (email, htmlContent) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reporte Diario de Calidad del Aire',
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Correo enviado a ${email}:`, info.response);
};

// Lógica principal
const sendAQIEmailToUsers = async () => {
  const data = await fetchAQIData();
  const emailContent = buildEmailContent(data);

  try {
    // Buscar usuarios con alertas activadas
    const usersWithAlerts = await User.find({ alerts: true });

    if (usersWithAlerts.length === 0) {
      console.log('No hay usuarios con alertas activadas.');
      return;
    }

    // Enviar mail a cada usuario
    for (const user of usersWithAlerts) {
      await sendEmail(user.email, emailContent);
    }

    console.log('Todos los correos fueron enviados correctamente.');
  } catch (error) {
    console.error('Error enviando correos:', error);
  }
};

module.exports = sendAQIEmailToUsers;
