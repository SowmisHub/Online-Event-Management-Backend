const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");

const ticketController = require("../controllers/ticketController");

/* ================= TICKET ROUTE ================= */

router.post(
  "/",
  verifyUser,
  ticketController.createTicket
);

module.exports = router;