const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const adminController = require("../controllers/adminController");

/* ================= ADMIN EVENT MANAGEMENT ================= */

router.post(
  "/events",
  verifyUser,
  verifyAdmin,
  adminController.createEvent
);

router.delete(
  "/events/:id",
  verifyUser,
  verifyAdmin,
  adminController.deleteEvent
);

router.put(
  "/events/:id",
  verifyUser,
  verifyAdmin,
  adminController.updateEvent
);


/* ================= ADMIN USERS ================= */

router.get(
  "/users",
  verifyUser,
  verifyAdmin,
  adminController.getUsers
);

router.get(
  "/users-for-speaker",
  verifyUser,
  verifyAdmin,
  adminController.getUsersForSpeaker
);


/* ================= SPEAKER ROLE ================= */

router.put(
  "/make-speaker/:id",
  verifyUser,
  verifyAdmin,
  adminController.makeSpeaker
);

router.put(
  "/remove-speaker/:id",
  verifyUser,
  verifyAdmin,
  adminController.removeSpeaker
);

module.exports = router;