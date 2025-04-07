const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mailer = require("../controllers/mailer"); // Asegúrate de que esta ruta sea correcta
const validator = require("validator");


const router = express.Router();

let verificationCodes = {};


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

// Ruta para enviar el código de verificación por correo
router.post("/send-verification-code", async (req, res) => {
  const { email } = req.body;

  // Verificar si ya se ha enviado un código de verificación y si no ha pasado el tiempo límite
  if (verificationCodes[email] && Date.now() - verificationCodes[email].timestamp < 30000) {
    const timeLeft = 30 - Math.floor((Date.now() - verificationCodes[email].timestamp) / 1000);
    return res.status(400).json({ message: `Espere ${timeLeft} segundos para reenviar el código.` });
  }

  const verificationCode = mailer.generateVerificationCode();
  verificationCodes[email] = { code: verificationCode, timestamp: Date.now() }; // Guardamos el código con un timestamp

  try {
    await mailer.sendVerificationCode(email, verificationCode);
    res.status(200).json({ message: "Código de verificación enviado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al enviar el código de verificación", error });
  }
});

// Ruta para enviar el código de verificación por correo, con verificación de usuario
router.post("/send-verification-code-user", async (req, res) => {
  const { email } = req.body;

  // Verificar si el correo existe en la base de datos
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  // Verificar si ya se ha enviado un código de verificación y si no ha pasado el tiempo límite
  if (verificationCodes[email] && Date.now() - verificationCodes[email].timestamp < 30000) {
    const timeLeft = 30 - Math.floor((Date.now() - verificationCodes[email].timestamp) / 1000);
    return res.status(400).json({ message: `Espere ${timeLeft} segundos para reenviar el código.` });
  }

  const verificationCode = mailer.generateVerificationCode();
  verificationCodes[email] = { code: verificationCode, timestamp: Date.now() }; // Guardamos el código con un timestamp

  try {
    await mailer.sendVerificationCode(email, verificationCode);
    res.status(200).json({ message: "Código de verificación enviado con éxito" });
  } catch (error) {
    res.status(500).json({ message: "Error al enviar el código de verificación", error });
  }
});

// Ruta para registrar al usuario y verificar el código
router.post("/signup", async (req, res) => {
  const { name, email, password, verificationCode } = req.body;

  if (!verificationCodes[email] || verificationCodes[email].code !== verificationCode) {
    return res.status(400).json({ message: "Código de verificación inválido o expirado" });
  }
  

  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial."
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo electrónico ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    delete verificationCodes[email];

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar el usuario", error });
  }
});

// API para restablecer la contraseña (corregida)
router.post("/reset-password", async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  // Verifica que el código esté presente y no haya expirado
  if (!verificationCodes[email] || verificationCodes[email].code !== verificationCode) {
    return res.status(400).json({ message: "Código de verificación inválido o expirado" });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      message: "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial."
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete verificationCodes[email];

    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la contraseña", error });
  }
});


// Ruta para iniciar sesión (login)
router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Correo electrónico o contraseña inválidos" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Correo electrónico o contraseña inválidos" });
      }
  
      // Verificar si ya hay una sesión activa
      if (user.session === "active") {
        return res.status(400).json({ message: "Ya hay una sesión activa para este usuario" });
      }
  
      // Cambiar el estado de 'session' de 'inactive' a 'active' cuando el usuario inicie sesión
      user.session = "active";
      await user.save(); // Guardamos los cambios en la base de datos
  
      const token = jwt.sign(
        { userId: user._id, type: user.type },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
  
      res.status(200).json({
        message: "Login exitoso",
        token,
        user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al iniciar sesión", error });
    }
  });
  
// Ruta para buscar usuarios por un término de búsqueda
router.get("/users", async (req, res) => {
    const { search } = req.query; // Captura el parámetro de búsqueda (por ejemplo, ?search=juan)
  
    if (!search) {
      return res.status(400).json({ message: "El parámetro de búsqueda es obligatorio." });
    }
  
    try {
      // Realizamos la búsqueda en los campos 'name' o 'email'
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } }, // Búsqueda insensible a mayúsculas
          { email: { $regex: search, $options: "i" } }
        ]
      });
  
      if (users.length === 0) {
        return res.status(404).json({ message: "No se encontraron usuarios." });
      }
  
      // Devolvemos los usuarios encontrados
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al buscar usuarios.", error });
    }
  });
  
// Ruta para cerrar sesión (logout)
router.post("/logout", async (req, res) => {
    try {
      const { token } = req.body;
  
      // Si estás utilizando un token JWT, puedes verificarlo para asegurarte de que es válido
      if (!token) {
        return res.status(400).json({ message: "Token no proporcionado" });
      }
  
      // Verificar que el token es válido
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Si el token es válido, puedes hacer lo que necesites. Por ejemplo, cambiar el estado de sesión en la base de datos.
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
  
      // Cambiar el estado de la sesión a 'inactive'
      user.session = "inactive";
      await user.save();
  
      // Responder con un mensaje de éxito
      res.status(200).json({ message: "Sesión cerrada exitosamente" });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      res.status(500).json({ message: "Error al cerrar sesión", error });
    }
  });
  

  // API para obtener el perfil del usuario
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extraer el token del header

    if (!token) {
      return res.status(401).json({ message: "No autorizado, token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// API para actualizar el perfil de un usuario
router.put("/update", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, verificationCode } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No autorizado, token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si el nombre se quiere cambiar
    if (name) {
      user.name = name;
    }

    // Si el correo electrónico se quiere cambiar
    if (email) {
      // Verificar el código de verificación antes de cambiar el correo
      if (!verificationCodes[email] || verificationCodes[email].code !== verificationCode) {
        return res.status(400).json({ message: 'Código de verificación incorrecto o expirado' });
      }
      
      user.email = email;
      delete verificationCodes[email]; // Eliminar el código de verificación una vez usado
    }

    // Si la contraseña se quiere cambiar, validamos la nueva contraseña
    if (password) {
      // Validar que la nueva contraseña cumpla con los requisitos
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({
          message: "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial."
        });
      }

      // Encriptar la nueva contraseña
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});


// API para actualizar el perfil de un usuario
router.put("/profile", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, verificationCode } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No autorizado, token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId); // Usamos el decoded para encontrar al usuario

    // Si el usuario no existe, no es necesario verificarlo aquí, ya que el token está verificado
    // Pasamos directamente a la actualización de los datos del usuario.

    // Si el nombre se quiere cambiar
    if (name) {
      user.name = name;
    }

    // Si el correo electrónico se quiere cambiar
    if (email) {
      // Verificar el código de verificación antes de cambiar el correo
      if (!verificationCodes[email] || verificationCodes[email].code !== verificationCode) {
        return res.status(400).json({ message: 'Código de verificación incorrecto o expirado' });
      }
      
      user.email = email;
      delete verificationCodes[email]; // Eliminar el código de verificación una vez usado
    }

    // Si la contraseña se quiere cambiar
    if (password) {
      // Validar que las contraseñas coincidan
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden' });
      }

      // Validar la contraseña en términos de seguridad
      if (!validatePassword(password)) {
        return res.status(400).json({
          message: "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial."
        });
      }

      // Encriptar la nueva contraseña
      user.password = await bcrypt.hash(password, 10);
    }

    // Guardar los cambios en el usuario
    await user.save();
    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: 'Error al actualizar perfil del usuario' });
  }
});

// Exportar rutas
module.exports = router;
