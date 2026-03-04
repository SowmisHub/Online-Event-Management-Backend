const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");

const registrationController = require("../controllers/registrationController");

/* ================= REGISTRATION ROUTES ================= */

router.post(
  "/:eventId",
  verifyUser,
  registrationController.registerEvent
);

router.delete(
  "/:eventId",
  verifyUser,
  registrationController.deleteRegistration
);

module.exports = router;