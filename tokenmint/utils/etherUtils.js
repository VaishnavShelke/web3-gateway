const ethers = require("ethers");

const getSignerAddressUtil = async (message, signedMessage, address) => {
  try {
    const signerAddress = await ethers.utils.verifyMessage(
      message,
      signedMessage
    );
    return signerAddress;
  } catch (err) {
    console.log(`error in verifying the singed message ${err.message}`);
  }
  return null;
};

module.exports = { getSignerAddressUtil };
