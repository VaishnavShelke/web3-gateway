const { ethers } = require("ethers");
require('dotenv').config();

const initProvider = async ({ }) => {
  try {
    const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
    const provider = new ethers.providers.JsonRpcProvider(
      `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    );
    return provider;
  } catch (error) {
    console.log(`Error In Initailizing Provider :: ${error.message}`);
    return null;
  }
};

module.exports = { initProvider };
