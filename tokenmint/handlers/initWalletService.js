const { ethers } = require("ethers");

const initWallet = async ({ provider }) => {
  try {
    const operatorPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const wallet = new ethers.Wallet(operatorPrivateKey, provider);
    return wallet;
  } catch (error) {
    console.log(`Error in initializing wallet  :: ${error.message}`);
    return null;
  }
};

module.exports = { initWallet };
