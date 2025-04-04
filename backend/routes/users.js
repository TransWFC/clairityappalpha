// routes/users.js
const express = require("express");
const {
    verifyToken,
    getAllUsers,
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    deactivateUser,  // Asegúrate de que deactivateUser está importado
    activateUser,
    getProfile,
    toggleAlerts,  // Asegúrate de que toggleAlerts está importado
} = require("../controllers/userController");

const router = express.Router();

router.get("/", verifyToken, getAllUsers);  // Obtener todos los usuarios
router.post("/", createUser);  // Crear usuario
router.post("/login", loginUser);  // Iniciar sesión
router.get("/profile", verifyToken, getProfile);  // Obtener perfil del usuario autenticado
router.put("/:id", verifyToken, updateUser);  // Actualizar usuario
router.put("/:id/toggle-alerts", verifyToken, toggleAlerts);  // Activar o desactivar alertas

router.delete("/:id", verifyToken, deleteUser);  // Eliminar usuario

// 🚨 Nueva ruta para desactivar un usuario
router.put("/:id/deactivate", verifyToken, deactivateUser);  // Desactivar usuario
router.put("/:id/activate", verifyToken, activateUser);  // Activar usuario

module.exports = router;
