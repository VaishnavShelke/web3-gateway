const ethers = require("ethers");
const tokenMintInventoryABI = require("../../tokenMintInventoryABI.json");
const { sendTokenTransferEvent } = require("./sendTokenTransferEvent");
require('dotenv').config();

const tokenMintInventoryTemp = [
  "function balanceOf(address account, uint256 id) public view returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes memory data) public",
  "event Transfer(address sender, address from, address to, uint256 id, uint256 value, bytes data)"
];

let provider;
let contract;
let isListening = false;

async function setupContract() {
  try {
    const API_URL = "wss://eth-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_API_KEY;
    provider = new ethers.providers.WebSocketProvider(API_URL);
    const tokenMintInventoryAddress = process.env.TOKEN_MINT_CONTRACT_ADDRESS;
    
    if (!tokenMintInventoryAddress) {
      throw new Error('TOKEN_MINT_CONTRACT_ADDRESS is not defined in environment variables');
    }

    contract = new ethers.Contract(
      tokenMintInventoryAddress,
      tokenMintInventoryTemp,
      provider
    );

    // Setup event listeners for provider
    provider._websocket.on('close', async () => {
      console.log('WebSocket connection closed. Attempting to reconnect...');
      isListening = false;
      setTimeout(setupContract, 5000); // Try to reconnect after 5 seconds
    });

    provider._websocket.on('error', async (error) => {
      console.error('WebSocket error:', error);
      isListening = false;
      setTimeout(setupContract, 5000);
    });

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
    contract.on(
      "Transfer",
      (sender, from, to, id, value, data, event) => {
        let info = {
          sender: sender,
          from: from,
          to: to,
          id: id.toString(),
          value: value.toString(),
          data: data,
          event: event
        };
        sendTokenTransferEvent(info);
        console.log(`Transfer Event Detected:`, JSON.stringify(info, null, 2));
      }
    );

    isListening = true;
    console.log('Event listener started successfully');
  } catch (error) {
    console.error('Error starting event listener:', error);
    isListening = false;
    setTimeout(startEventListener, 5000);
  }
}

// Export both the start function and the contract instance
module.exports = {
  startEventListener,
  getContract: () => contract,
  isListening: () => isListening
};
   
 