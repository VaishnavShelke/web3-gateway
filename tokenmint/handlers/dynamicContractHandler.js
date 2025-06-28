const { ethers } = require("ethers");
const { fetchFromGithub } = require("../utils/githubUtils");
const { initProvider } = require("./initProviderService");
const { initWallet } = require("./initWalletService");
const { 
  validateAndConvertParams, 
  formatContractResult, 
  validateTransactionOverrides,
  getFunctionSignature 
} = require("../utils/contractTypeUtils");
require("dotenv").config();

class DynamicContractHandler {
  constructor() {
    this.contract = null;
    this.contractWithSigner = null;
    this.abi = null;
    this.provider = null;
    this.wallet = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) return true;

      // Initialize provider
      this.provider = await initProvider({});
      if (!this.provider) {
        throw new Error("Failed to initialize provider");
      }

      // Initialize wallet
      this.wallet = await initWallet({ provider: this.provider });
      if (!this.wallet) {
        throw new Error("Failed to initialize wallet");
      }

      // Get contract address
      const contractAddress = process.env.TOKEN_MINT_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("TOKEN_MINT_CONTRACT_ADDRESS environment variable is not set");
      }

      // Fetch ABI from GitHub
      const githubRawUrl = process.env.CONTRACT_ABI_GITHUB_URL;
      if (!githubRawUrl) {
        throw new Error("CONTRACT_ABI_GITHUB_URL environment variable is not set");
      }

      const abiData = await fetchFromGithub(githubRawUrl);
      this.abi = JSON.parse(abiData);

      // Initialize contract instances
      this.contract = new ethers.Contract(contractAddress, this.abi, this.provider);
      this.contractWithSigner = new ethers.Contract(contractAddress, this.abi, this.wallet);

      this.initialized = true;
      console.log("Dynamic Contract Handler initialized successfully");
      return true;
    } catch (error) {
      console.error("Error initializing Dynamic Contract Handler:", error.message);
      return false;
    }
  }

  async callReadFunction(functionName, params = []) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.contract[functionName]) {
        throw new Error(`Function ${functionName} not found in contract`);
      }

      // Get function ABI for parameter validation and result formatting
      const functionAbi = this.getFunctionDetails().find(f => f.name === functionName);
      if (!functionAbi) {
        throw new Error(`Function ABI not found for ${functionName}`);
      }

      // Validate and convert parameters
      const convertedParams = validateAndConvertParams(functionAbi.inputs, params);

      const result = await this.contract[functionName](...convertedParams);
      
      // Format the result based on output types
      const formattedResult = formatContractResult(result, functionAbi.outputs);

      return {
        success: true,
        data: formattedResult,
        signature: getFunctionSignature(functionAbi),
        transactionHash: null
      };
    } catch (error) {
      console.error(`Error calling read function ${functionName}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async callWriteFunction(functionName, params = [], overrides = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.contractWithSigner[functionName]) {
        throw new Error(`Function ${functionName} not found in contract`);
      }

      // Get function ABI for parameter validation
      const functionAbi = this.getFunctionDetails().find(f => f.name === functionName);
      if (!functionAbi) {
        throw new Error(`Function ABI not found for ${functionName}`);
      }

      // Validate and convert parameters
      const convertedParams = validateAndConvertParams(functionAbi.inputs, params);
      
      // Validate transaction overrides
      const validatedOverrides = validateTransactionOverrides(overrides);

      // Set default gas limit if not provided
      if (!validatedOverrides.gasLimit) {
        try {
          const estimatedGas = await this.contractWithSigner.estimateGas[functionName](...convertedParams);
          validatedOverrides.gasLimit = estimatedGas.mul(110).div(100); // Add 10% buffer
        } catch (gasError) {
          console.warn("Could not estimate gas, using default:", gasError.message);
          validatedOverrides.gasLimit = 300000; // Default gas limit
        }
      }

      const transaction = await this.contractWithSigner[functionName](...convertedParams, validatedOverrides);
      const receipt = await transaction.wait();

      return {
        success: true,
        data: receipt,
        signature: getFunctionSignature(functionAbi),
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : null
      };
    } catch (error) {
      console.error(`Error calling write function ${functionName}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  getFunctionDetails() {
    if (!this.abi) return [];

    return this.abi
      .filter(item => item.type === 'function')
      .map(func => ({
        name: func.name,
        inputs: func.inputs,
        outputs: func.outputs,
        stateMutability: func.stateMutability,
        isReadOnly: func.stateMutability === 'view' || func.stateMutability === 'pure',
        isWrite: func.stateMutability !== 'view' && func.stateMutability !== 'pure'
      }));
  }

  getEventDetails() {
    if (!this.abi) return [];

    return this.abi
      .filter(item => item.type === 'event')
      .map(event => ({
        name: event.name,
        inputs: event.inputs,
        anonymous: event.anonymous || false
      }));
  }

  async getContractInfo() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      return {
        contractAddress: this.contract.address,
        functions: this.getFunctionDetails(),
        events: this.getEventDetails(),
        abi: this.abi
      };
    } catch (error) {
      console.error("Error getting contract info:", error.message);
      return null;
    }
  }

  validateFunctionParams(functionName, params) {
    const funcDetails = this.getFunctionDetails().find(f => f.name === functionName);
    if (!funcDetails) {
      throw new Error(`Function ${functionName} not found`);
    }

    // Use the enhanced validation from contractTypeUtils
    validateAndConvertParams(funcDetails.inputs, params);
    return true;
  }
}

// Singleton instance
const dynamicContractHandler = new DynamicContractHandler();

module.exports = {
  DynamicContractHandler,
  dynamicContractHandler
}; 