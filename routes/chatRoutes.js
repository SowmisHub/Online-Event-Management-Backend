const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const chatController = require("../controllers/chatController");

/* ================= CHAT MODERATION ROUTES ================= */

router.delete(
  "/:id",
  verifyUser,
  verifyAdmin,
  chatController.deleteMessage
);

router.delete(
  "/event/:eventId",
  verifyUser,
  verifyAdmin,
  chatController.clearEventChat
);

module.exports = router;