const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailer = require("../controllers/mailer"); // Asegúrate de tener el controlador de mailer
const validator = require("validator");

// Función para validar la contraseña
const validatePassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    returnScore: false, 
  });
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
    // Check if this is an email existence check
    if (req.query.email) {
      const existingUser = await User.findOne({ email: req.query.email });
      return res.json({ exists: !!existingUser });
    }
    
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener los usuarios", error: err });
  }
};

// Crear un usuario (FIXED VERSION)
const createUser = async (req, res) => {
  const { name, email, password, type } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Nombre, email y contraseña son campos obligatorios"
    });
  }

  // Validar la contraseña
  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales"
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with active status (since it's created by admin)
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      type: type || "user",
      status: "active", // Set as active since it's created by admin
      verificationCode: null // No verification needed for admin-created users
    });

    await newUser.save();
    
    res.status(201).json({ 
      message: "Usuario creado exitosamente",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: "Error al crear el usuario", error: err.message });
  }
};

// Registrar un usuario (con verificación por email)
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  // Validar la contraseña
  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres, incluyendo letras mayúsculas, minúsculas, números y caracteres especiales"
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const verificationCode = generateVerificationCode();
    // Enviar el código de verificación
    await sendVerificationCode(email, verificationCode);

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      status: "inactive", 
      verificationCode 
    });

    await newUser.save();
    res.status(201).json({ message: "Usuario registrado correctamente. Verifique su correo para activar su cuenta." });
  } catch (err) {
    res.status(500).json({ message: "Error al registrar el usuario", error: err });
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
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        type: user.type,
        alerts: user.alerts 
      } 
    });
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
    user.verificationCode = null; // Clear verification code
    await user.save();

    res.status(200).json({ message: "Cuenta activada exitosamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al verificar el correo", error: err });
  }
};

// Actualizar un usuario (FIXED VERSION)
const updateUser = async (req, res) => {
  const { name, email, password, type } = req.body;
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

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "El correo electrónico ya está registrado" });
      }
      user.email = email;
    }

    // Update fields only if they are provided
    if (name !== undefined) user.name = name;
    if (type !== undefined) user.type = type;
    
    // Hash and update password only if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    
    res.json({ 
      message: "Usuario actualizado correctamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        type: user.type,
        status: user.status
      }
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Error al actualizar el usuario", error: err.message });
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

// Backend function - Keep using 'alerts' property name as defined in your User model
const toggleAlerts = async (req, res) => {
  const userId = req.params.id;
  const { alertsEnabled } = req.body; // Changed from { alerts } to match frontend property name

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    
    user.alerts = alertsEnabled; // Using alertsEnabled from request to set user.alerts
    await user.save();
    
    res.json({ 
      message: `Alertas ${alertsEnabled ? "activadas" : "desactivadas"} correctamente`,
      alerts: alertsEnabled // Return the new value to the frontend
    });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar las alertas", error: err });
  }
};

// Exportar todas las funciones necesarias
module.exports = {
    verifyToken,
    getAllUsers,
    createUser,
    registerUser, // Export both functions
    loginUser,
    verifyEmail,
    updateUser,
    deleteUser,
    deactivateUser,
    activateUser,
    getProfile,
    toggleAlerts
};