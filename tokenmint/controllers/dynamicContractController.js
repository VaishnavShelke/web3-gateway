const asyncHandler = require("express-async-handler");
const { dynamicContractHandler } = require("../handlers/dynamicContractHandler");
const { INTERNAL_SERVER_ERROR } = require("../utils/constants");

// Get contract information including all functions and events
const getContractInfo = asyncHandler(async (req, res) => {
  try {
    const contractInfo = await dynamicContractHandler.getContractInfo();
    
    if (!contractInfo) {
      return res.status(500).json({
        success: false,
        message: "Failed to get contract information"
      });
    }

    res.json({
      success: true,
      data: contractInfo
    });
  } catch (error) {
    console.error("Error in getContractInfo:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Call read-only functions (view/pure)
const callReadFunction = asyncHandler(async (req, res) => {
  try {
    const { functionName } = req.params;
    const { params = [] } = req.body;

    // Validate function exists and is read-only
    const functions = dynamicContractHandler.getFunctionDetails();
    const targetFunction = functions.find(f => f.name === functionName);
    
    if (!targetFunction) {
      return res.status(400).json({
        success: false,
        message: `Function '${functionName}' not found in contract`
      });
    }

    if (!targetFunction.isReadOnly) {
      return res.status(400).json({
        success: false,
        message: `Function '${functionName}' is not a read-only function. Use the write endpoint instead.`
      });
    }

    // Validate parameters
    try {
      dynamicContractHandler.validateFunctionParams(functionName, params);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    const result = await dynamicContractHandler.callReadFunction(functionName, params);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      function: functionName,
      parameters: params,
      result: result.data
    });
  } catch (error) {
    console.error("Error in callReadFunction:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Call write functions (state-changing)
const callWriteFunction = asyncHandler(async (req, res) => {
  try {
    const { functionName } = req.params;
    const { params = [], overrides = {} } = req.body;

    // Validate function exists and is writable
    const functions = dynamicContractHandler.getFunctionDetails();
    const targetFunction = functions.find(f => f.name === functionName);
    
    if (!targetFunction) {
      return res.status(400).json({
        success: false,
        message: `Function '${functionName}' not found in contract`
      });
    }

    if (!targetFunction.isWrite) {
      return res.status(400).json({
        success: false,
        message: `Function '${functionName}' is a read-only function. Use the read endpoint instead.`
      });
    }

    // Validate parameters
    try {
      dynamicContractHandler.validateFunctionParams(functionName, params);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    const result = await dynamicContractHandler.callWriteFunction(functionName, params, overrides);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      function: functionName,
      parameters: params,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      receipt: result.data
    });
  } catch (error) {
    console.error("Error in callWriteFunction:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get specific function details
const getFunctionDetails = asyncHandler(async (req, res) => {
  try {
    const { functionName } = req.params;
    
    const functions = dynamicContractHandler.getFunctionDetails();
    const targetFunction = functions.find(f => f.name === functionName);
    
    if (!targetFunction) {
      return res.status(404).json({
        success: false,
        message: `Function '${functionName}' not found in contract`
      });
    }

    res.json({
      success: true,
      function: targetFunction
    });
  } catch (error) {
    console.error("Error in getFunctionDetails:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all available functions
const getAllFunctions = asyncHandler(async (req, res) => {
  try {
    const functions = dynamicContractHandler.getFunctionDetails();
    
    res.json({
      success: true,
      functions: {
        readOnly: functions.filter(f => f.isReadOnly),
        write: functions.filter(f => f.isWrite),
        all: functions
      }
    });
  } catch (error) {
    console.error("Error in getAllFunctions:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Batch call multiple read functions
const batchReadFunctions = asyncHandler(async (req, res) => {
  try {
    const { calls } = req.body;
    
    if (!Array.isArray(calls)) {
      return res.status(400).json({
        success: false,
        message: "Calls must be an array of {functionName, params} objects"
      });
    }

    const results = [];
    
    for (const call of calls) {
      const { functionName, params = [] } = call;
      
      try {
        const result = await dynamicContractHandler.callReadFunction(functionName, params);
        results.push({
          functionName,
          params,
          success: result.success,
          result: result.success ? result.data : null,
          error: result.success ? null : result.error
        });
      } catch (error) {
        results.push({
          functionName,
          params,
          success: false,
          result: null,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error("Error in batchReadFunctions:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  getContractInfo,
  callReadFunction,
  callWriteFunction,
  getFunctionDetails,
  getAllFunctions,
  batchReadFunctions
}; 