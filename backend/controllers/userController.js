const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("../controllers/mailer"); // Asegúrate de tener el controlador de mailer

// Función para validar la contraseña
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};

// Función para generar un código de verificación aleatorio
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000); // Código de 6 dígitos
};

// Enviar código de verificación por correo
const sendVerificationCode = async (email, verificationCode) => {
  try {
    await mailer.sendVerificationCode(email, verificationCode);
  } catch (err) {
    throw new Error("Error al enviar el código de verificación");
  }
};

// Verificar si el usuario está autenticado
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token no válido" });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Obtener todos los usuarios (excluyendo contraseñas)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener los usuarios", error: err });
  }
};

// Crear un usuario
const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Validar la contraseña
  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales"
    });
  }

  else {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "El correo ya está registrado" });
      }
  
      const verificationCode = generateVerificationCode();
      // Enviar el código de verificación
      await sendVerificationCode(email, verificationCode);
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword, status: "inactive", verificationCode });
  
      await newUser.save();
      res.status(201).json({ message: "Usuario registrado correctamente. Verifique su correo para activar su cuenta." });
    } catch (err) {
      res.status(500).json({ message: "Error al registrar el usuario", error: err });
    }
  }
};

// Iniciar sesión y generar token
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Correo o contraseña incorrectos" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Cuenta desactivada, por favor verifique su correo electrónico" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Correo o contraseña incorrectos" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, alerts: user.alerts } });
  } catch (err) {
    res.status(500).json({ message: "Error al iniciar sesión", error: err });
  }
};

// Verificar el código de verificación y activar la cuenta
const verifyEmail = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ message: "Código de verificación incorrecto" });
    }

    user.status = "active";
    await user.save();

    res.status(200).json({ message: "Cuenta activada exitosamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al verificar el correo", error: err });
  }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.params.id;

  // Validar la nueva contraseña (si se proporciona)
  if (password && !validatePassword(password)) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales"
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.json({ message: "Usuario actualizado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar el usuario", error: err });
  }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar el usuario", error: err });
  }
};

// Desactivar usuario (cambiar status a "inactive")
const deactivateUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    user.status = "inactive";
    await user.save();

    res.json({ message: "Usuario desactivado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al desactivar el usuario", error: err });
  }
};
// Función para activar un usuario
const activateUser = async (req, res) => {
    const userId = req.params.id;
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
  
      user.status = "active";  // Cambiar el estado a activo
      await user.save();
  
      res.json({ message: "Usuario activado correctamente" });
    } catch (err) {
      res.status(500).json({ message: "Error al activar el usuario", error: err.message });
    }
  };
  

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener el perfil", error: err });
  }
};

// Backend: Activar o desactivar alertas
const toggleAlerts = async (req, res) => {
  const userId = req.params.id;
  const { alerts } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.alerts = alerts;
    await user.save();

    res.json({ message: `Alertas ${alerts ? "activadas" : "desactivadas"} correctamente` });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar las alertas", error: err });
  }
};


// Exportar todas las funciones necesarias
module.exports = {
    verifyToken,
    getAllUsers,
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    deactivateUser,
    activateUser,
    getProfile,
    toggleAlerts
};