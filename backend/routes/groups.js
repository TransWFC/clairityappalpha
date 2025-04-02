const express = require("express");
const router = express.Router();
const { getGroups } = require("../controllers/groupsController");

router.get("/", getGroups);

module.exports = router;
