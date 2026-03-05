const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const pollController = require("../controllers/pollController");

/* ================= ADMIN POLL ROUTES ================= */

/* GET POLLS (ADMIN) */
router.get(
  "/admin/polls",
  verifyUser,
  verifyAdmin,
  pollController.getPolls
);

/* CREATE POLL */
router.post(
  "/admin/polls",
  verifyUser,
  verifyAdmin,
  pollController.createPoll
);

/* UPDATE POLL */
router.put(
  "/admin/polls/:id",
  verifyUser,
  verifyAdmin,
  pollController.updatePoll
);

/* DELETE POLL */
router.delete(
  "/admin/polls/:id",
  verifyUser,
  verifyAdmin,
  pollController.deletePoll
);


/* ================= USER VOTE ================= */

router.post(
  "/polls/vote",
  verifyUser,
  pollController.votePoll
);

module.exports = router;