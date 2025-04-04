const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, default: "user" }, // Default user type
  alerts: { type: Boolean, default: false }, // Empty alerts by default
  status: { type: String, default: "active" }, // Default status is active
  session: { type: String, default: "inactive" }, // inactive session by default
});

module.exports = mongoose.model("User", UserSchema);