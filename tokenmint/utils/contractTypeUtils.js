const { ethers } = require("ethers");

/**
 * Validates and converts input parameters based on Solidity types
 * @param {Array} inputs - ABI input definitions
 * @param {Array} params - Raw parameters from request
 * @returns {Array} - Validated and converted parameters
 */
function validateAndConvertParams(inputs, params) {
  if (inputs.length !== params.length) {
    throw new Error(`Expected ${inputs.length} parameters, got ${params.length}`);
  }

  return inputs.map((input, index) => {
    const param = params[index];
    const type = input.type;
    
    try {
      return convertParamByType(param, type, input.name);
    } catch (error) {
      throw new Error(`Parameter '${input.name}' (${type}): ${error.message}`);
    }
  });
}

/**
 * Converts a parameter to the appropriate type based on Solidity type
 * @param {any} param - Raw parameter value
 * @param {string} type - Solidity type (e.g., 'uint256', 'address', 'bool')
 * @param {string} name - Parameter name for error messages
 * @returns {any} - Converted parameter
 */
function convertParamByType(param, type, name = 'parameter') {
  // Handle null/undefined
  if (param === null || param === undefined) {
    throw new Error(`${name} cannot be null or undefined`);
  }

  // Address type
  if (type === 'address') {
    if (typeof param !== 'string') {
      throw new Error(`${name} must be a string for address type`);
    }
    if (!ethers.utils.isAddress(param)) {
      throw new Error(`${name} is not a valid Ethereum address`);
    }
    return ethers.utils.getAddress(param); // Checksum address
  }

  // Boolean type
  if (type === 'bool') {
    if (typeof param === 'boolean') return param;
    if (typeof param === 'string') {
      if (param.toLowerCase() === 'true') return true;
      if (param.toLowerCase() === 'false') return false;
    }
    if (typeof param === 'number') {
      return param !== 0;
    }
    throw new Error(`${name} must be a boolean, "true", "false", or number`);
  }

  // Integer types (uint, int)
  if (type.includes('uint') || type.includes('int')) {
    if (typeof param === 'number') {
      return ethers.BigNumber.from(param);
    }
    if (typeof param === 'string') {
      try {
        return ethers.BigNumber.from(param);
      } catch (error) {
        throw new Error(`${name} is not a valid number`);
      }
    }
    throw new Error(`${name} must be a number or numeric string`);
  }

  // Bytes types
  if (type.includes('bytes')) {
    if (typeof param !== 'string') {
      throw new Error(`${name} must be a string for bytes type`);
    }
    if (!ethers.utils.isHexString(param)) {
      throw new Error(`${name} must be a valid hex string`);
    }
    return param;
  }

  // String type
  if (type === 'string') {
    if (typeof param !== 'string') {
      throw new Error(`${name} must be a string`);
    }
    return param;
  }

  // Array types
  if (type.includes('[')) {
    if (!Array.isArray(param)) {
      throw new Error(`${name} must be an array`);
    }
    
    // Extract base type from array type (e.g., 'uint256[]' -> 'uint256')
    const baseType = type.replace(/\[\d*\]$/, '');
    
    return param.map((item, index) => 
      convertParamByType(item, baseType, `${name}[${index}]`)
    );
  }

  // For other types, return as-is (might need expansion for structs, etc.)
  return param;
}

/**
 * Formats contract function output for API response
 * @param {any} result - Raw contract function result
 * @param {Array} outputs - ABI output definitions
 * @returns {any} - Formatted result
 */
function formatContractResult(result, outputs) {
  if (!outputs || outputs.length === 0) {
    return null;
  }

  if (outputs.length === 1) {
    return formatSingleOutput(result, outputs[0]);
  }

  // Multiple outputs - return as object with named properties
  const formatted = {};
  outputs.forEach((output, index) => {
    const key = output.name || `output${index}`;
    formatted[key] = formatSingleOutput(result[index], output);
  });

  return formatted;
}

/**
 * Formats a single output value
 * @param {any} value - Raw output value
 * @param {Object} output - ABI output definition
 * @returns {any} - Formatted value
 */
function formatSingleOutput(value, output) {
  const type = output.type;

  // BigNumber conversion
  if (ethers.BigNumber.isBigNumber(value)) {
    return value.toString();
  }

  // Array handling
  if (Array.isArray(value)) {
    return value.map(item => formatSingleOutput(item, { type: type.replace(/\[\d*\]$/, '') }));
  }

  // Address checksumming
  if (type === 'address' && typeof value === 'string') {
    return ethers.utils.getAddress(value);
  }

  return value;
}

/**
 * Validates transaction overrides
 * @param {Object} overrides - Transaction overrides
 * @returns {Object} - Validated overrides
 */
function validateTransactionOverrides(overrides = {}) {
  const validated = {};

  if (overrides.gasLimit) {
    validated.gasLimit = ethers.BigNumber.from(overrides.gasLimit);
  }

  if (overrides.gasPrice) {
    validated.gasPrice = ethers.BigNumber.from(overrides.gasPrice);
  }

  if (overrides.maxFeePerGas) {
    validated.maxFeePerGas = ethers.BigNumber.from(overrides.maxFeePerGas);
  }

  if (overrides.maxPriorityFeePerGas) {
    validated.maxPriorityFeePerGas = ethers.BigNumber.from(overrides.maxPriorityFeePerGas);
  }

  if (overrides.value) {
    validated.value = ethers.BigNumber.from(overrides.value);
  }

  if (overrides.nonce !== undefined) {
    validated.nonce = parseInt(overrides.nonce);
  }

  return validated;
}

/**
 * Gets human-readable function signature
 * @param {Object} functionAbi - Function ABI definition
 * @returns {string} - Human-readable signature
 */
function getFunctionSignature(functionAbi) {
  const inputs = functionAbi.inputs || [];
  const inputTypes = inputs.map(input => `${input.type} ${input.name}`).join(', ');
  
  let signature = `${functionAbi.name}(${inputTypes})`;
  
  if (functionAbi.outputs && functionAbi.outputs.length > 0) {
    const outputTypes = functionAbi.outputs.map(output => 
      `${output.type}${output.name ? ` ${output.name}` : ''}`
    ).join(', ');
    signature += ` returns (${outputTypes})`;
  }
  
  return signature;
}

module.exports = {
  validateAndConvertParams,
  convertParamByType,
  formatContractResult,
  formatSingleOutput,
  validateTransactionOverrides,
  getFunctionSignature
}; 