const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");

/* ================= EVENT ROUTES ================= */

router.get("/", eventController.getEvents);

router.get("/:id", eventController.getSingleEvent);

module.exports = router;