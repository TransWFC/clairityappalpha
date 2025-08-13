// routes/users.js
const express = require("express");
const {
    verifyToken,
    getAllUsers,
    createUser,
    registerUser,
    loginUser,
    verifyEmail,
    updateUser,
    deleteUser,
    deactivateUser,
    activateUser,
    getProfile,
    toggleAlerts,
} = require("../controllers/userController");

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", registerUser);  // User self-registration with email verification
router.post("/login", loginUser);  // Login
router.post("/verify-email", verifyEmail);  // Email verification

// Protected routes (authentication required)
router.get("/", verifyToken, getAllUsers);  // Get all users + email existence check
router.post("/", verifyToken, createUser);  // Admin create user (no email verification needed)
router.get("/profile", verifyToken, getProfile);  // Get authenticated user profile
router.put("/:id", verifyToken, updateUser);  // Update user
router.put("/:id/toggle-alerts", verifyToken, toggleAlerts);  // Toggle alerts
router.delete("/:id", verifyToken, deleteUser);  // Delete user

// User status management
router.put("/:id/deactivate", verifyToken, deactivateUser);  // Deactivate user
router.put("/:id/activate", verifyToken, activateUser);  // Activate user

module.exports = router;