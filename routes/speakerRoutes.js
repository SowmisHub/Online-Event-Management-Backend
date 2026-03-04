const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");

const speakerController = require("../controllers/speakerController");

/* ================= SPEAKER ROUTES ================= */

router.get(
  "/speaker",
  verifyUser,
  speakerController.getSpeakerDashboard
);

router.put(
  "/update-meeting/:id",
  verifyUser,
  speakerController.updateMeetingURL
);

router.get(
  "/polls",
  verifyUser,
  speakerController.getSpeakerPolls
);

module.exports = router;