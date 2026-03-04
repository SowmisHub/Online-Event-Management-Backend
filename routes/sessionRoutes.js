const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const sessionController = require("../controllers/sessionController");

/* ================= SESSION ROUTES ================= */

router.post(
  "/assign-session",
  verifyUser,
  verifyAdmin,
  sessionController.assignSession
);

router.get(
  "/speakers",
  verifyUser,
  verifyAdmin,
  sessionController.getSpeakers
);

router.get(
  "/speaker-sessions/:id",
  verifyUser,
  verifyAdmin,
  sessionController.getSpeakerSessions
);

router.delete(
  "/delete-session/:id",
  verifyUser,
  verifyAdmin,
  sessionController.deleteSession
);

router.put(
  "/update-session/:id",
  verifyUser,
  verifyAdmin,
  sessionController.updateSession
);

router.get(
  "/all-sessions",
  verifyUser,
  verifyAdmin,
  sessionController.getAllSessions
);

module.exports = router;