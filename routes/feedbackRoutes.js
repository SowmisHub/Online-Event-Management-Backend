const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const feedbackController = require("../controllers/feedbackController");

/* ================= FEEDBACK ROUTES ================= */

router.post(
  "/",
  verifyUser,
  feedbackController.submitFeedback
);

router.get(
  "/",
  verifyUser,
  verifyAdmin,
  feedbackController.getFeedback
);

module.exports = router;