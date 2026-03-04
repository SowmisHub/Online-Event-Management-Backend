const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/verifyUser");

const qaController = require("../controllers/qacontroller");

/* ================= Q&A ROUTES ================= */

router.get(
  "/",
  verifyUser,
  qaController.getQA
);

router.post(
  "/",
  verifyUser,
  qaController.createQA
);

router.delete(
  "/:id",
  verifyUser,
  qaController.deleteQA
);

module.exports = router;