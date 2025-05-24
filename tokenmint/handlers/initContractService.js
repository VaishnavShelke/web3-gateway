const { ethers } = require("ethers");

const initContract = async ({ contractAddress, provider }) => {
  const contractABI = [
    "function balanceOf(address account, uint256 id) public view returns (uint256)",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes memory data) public",
    "function mySafeTransferFrom(address from, address to, uint256 id, uint256 value, bytes memory data) public",
  ];
  try {
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
