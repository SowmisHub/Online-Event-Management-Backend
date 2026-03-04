const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const announcementController = require("../controllers/announcementController");

/* ================= ANNOUNCEMENT ROUTES ================= */

router.get(
  "/",
  verifyUser,
  verifyAdmin,
  announcementController.getAnnouncements
);

router.post(
  "/",
  verifyUser,
  verifyAdmin,
  announcementController.createAnnouncement
);

router.put(
  "/:id",
  verifyUser,
  verifyAdmin,
  announcementController.updateAnnouncement
);

router.delete(
  "/:id",
  verifyUser,
  verifyAdmin,
  announcementController.deleteAnnouncement
);

module.exports = router;