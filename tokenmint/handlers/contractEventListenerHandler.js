const { ethers } = require("ethers");
const { fetchFromGithub } = require("../utils/githubUtils");
const { sendTokenTransferEvent } = require("./sendTokenTransferEvent");
const { checkContractEvents } = require("../utils/eventSignatureUtils");
const ContractEventScanner = require("../utils/contractEventScanner");
require('dotenv').config();

let provider;
let contract;
let isListening = false;
let eventScanner;

async function setupContract() {
  try {
    const API_URL = "https://eth-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY;
    provider = new ethers.providers.JsonRpcProvider(API_URL);
    const tokenMintInventoryAddress = process.env.TOKEN_MINT_CONTRACT_ADDRESS;
    
    if (!tokenMintInventoryAddress) {
      throw new Error('TOKEN_MINT_CONTRACT_ADDRESS is not defined in environment variables');
    }

    // Get GitHub raw URL from environment variable
    const githubRawUrl = process.env.CONTRACT_ABI_GITHUB_URL;
    if (!githubRawUrl) {
      throw new Error("CONTRACT_ABI_GITHUB_URL environment variable is not set");
    }

    // Fetch and parse the ABI from GitHub
    const abiData = await fetchFromGithub(githubRawUrl);
    console.log("Raw ABI data from GitHub:", abiData);
    const contractABI = JSON.parse(abiData);
    
    // Print the loaded ABI
    console.log("Loaded Contract ABI for Event Listener:", JSON.stringify(contractABI));

    contract = new ethers.Contract(
      tokenMintInventoryAddress,
      contractABI,
      provider
    );

    // Debug: Print all available events in the contract
    console.log("\nAvailable events in contract:");
    console.log("Contract interface:", contract.interface);
    console.log("Events:", contract.interface.events);
    console.log("Event names:", Object.keys(contract.interface.events));
    console.log("Full event definitions:", JSON.stringify(contract.interface.events));

    // Check if contract has the Transfer event
    const hasTransferEvent = await checkContractEvents(contract);
    if (!hasTransferEvent) {
      throw new Error('Contract does not have the Transfer event or event signature does not match');
    }

    return true;
  } catch (error) {
    console.error('Error setting up contract:', error);
    return false;
  }
}

async function startEventListener() {
  if (isListening) {
    console.log('Event listener is already running');
    return;
  }

  const setupSuccess = await setupContract();
  if (!setupSuccess) {
    console.error('Failed to setup contract. Retrying in 5 seconds...');
    setTimeout(startEventListener, 5000);
    return;
  }

  try {
    console.log('Setting up Transfer event listener...');
    console.log('Contract address:', contract.address);
    console.log('Provider network:', await provider.getNetwork());
    
    // Initialize and start the event scanner
    eventScanner = new ContractEventScanner(contract, provider);
    await eventScanner.startScanning();
    
    isListening = true;
    console.log('Event listener started successfully');
    
    // Add periodic health check
    setInterval(async () => {
      if (isListening) {
        try {
          const blockNumber = await provider.getBlockNumber();
          console.log(`Event listener is healthy. Current block: ${blockNumber}`);
          console.log(`Event scanner is ${eventScanner.isRunning() ? 'running' : 'stopped'}`);
          console.log(`Last scanned block: ${eventScanner.getLastScannedBlock()}`);
        } catch (error) {
          console.error('Health check failed:', error);
        }
      }
    }, 30000); // Check every 30 seconds

  } catch (error) {
    console.error('Error starting event listener:', error);
    isListening = false;
    if (eventScanner) {
      await eventScanner.stopScanning();
    }
    setTimeout(startEventListener, 5000);
  }
}

// Export both the start function and the contract instance
module.exports = {
  startEventListener,
  getContract: () => contract,
  isListening: () => isListening
};
   
 