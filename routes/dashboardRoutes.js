const express = require("express");
const router = express.Router();
const { getUserDashboard } = require("../controllers/dashboardController");
const verifyUser = require("../middleware/verifyUser");

router.get("/user", verifyUser, getUserDashboard);

module.exports = router;