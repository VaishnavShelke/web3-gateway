const express = require("express");
const router = express.Router();

const {
  verifyAddressHandler,
} = require("../controllers/verifyAddressController.js");

router.post("/verifyAddress", verifyAddressHandler);

module.exports = router;
