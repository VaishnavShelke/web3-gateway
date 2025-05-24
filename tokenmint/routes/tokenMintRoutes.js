const express = require("express");
const router = express.Router();

const {
  transferTokensHandler,
} = require("../controllers/contractInterfaceController.js");

router.post("/transferTokensFromGame", transferTokensHandler);

module.exports = router;
