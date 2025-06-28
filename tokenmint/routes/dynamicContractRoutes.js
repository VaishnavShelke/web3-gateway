const express = require("express");
const router = express.Router();

const {
  getContractInfo,
  callReadFunction,
  callWriteFunction,
  getFunctionDetails,
  getAllFunctions,
  batchReadFunctions
} = require("../controllers/dynamicContractController");

// Get complete contract information (ABI, functions, events)
router.get("/info", getContractInfo);

// Get all available functions categorized by type
router.get("/functions", getAllFunctions);

// Get specific function details
router.get("/functions/:functionName", getFunctionDetails);

// Call read-only functions (view/pure functions)
router.post("/read/:functionName", callReadFunction);

// Call write functions (state-changing functions)
router.post("/write/:functionName", callWriteFunction);

// Batch call multiple read functions
router.post("/batch/read", batchReadFunctions);

module.exports = router; 