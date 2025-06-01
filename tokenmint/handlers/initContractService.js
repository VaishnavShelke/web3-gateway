const { ethers } = require("ethers");
const { fetchFromGithub } = require("../utils/githubUtils");
require("dotenv").config();

const initContract = async ({ contractAddress, provider }) => {
  try {
    // Get GitHub raw URL from environment variable
    const githubRawUrl = process.env.CONTRACT_ABI_GITHUB_URL;
    if (!githubRawUrl) {
      throw new Error("CONTRACT_ABI_GITHUB_URL environment variable is not set");
    }

    // Fetch and parse the ABI from GitHub
    const abiData = await fetchFromGithub(githubRawUrl);
    const contractABI = JSON.parse(abiData);
    
    // Print the loaded ABI
    console.log("Loaded Contract ABI:", JSON.stringify(contractABI));

    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );
    return contract;
  } catch (error) {
    console.log(`Error in initializing contract :: ${error.message}`);
    return null;
  }
};

module.exports = { initContract };
