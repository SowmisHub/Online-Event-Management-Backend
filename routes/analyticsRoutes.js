const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const analyticsController = require("../controllers/analyticsController");

/* ================= ADMIN ANALYTICS ================= */

router.get(
  "/",
  verifyUser,
  verifyAdmin,
  analyticsController.getAnalytics
);

module.exports = router;