const axios = require("axios");

const apiUrl = process.env.TRANSFER_TOKEN_EVENT_TBS_ENDPOINT;


const sendTokenTransferEvent = async (info) => {
  try {
    const postData = {
      tokenMintTransactionId: info.data,
      operator: info.operator,
      from: info.from,
      to: info.to,
      value: info.value,
      transactionReciept: {
        blockNumber: info.event.blockNumber,
        transactionHash: info.event.transactionHash,
      },
    };
    console.log("\n\n#############################################################");
    console.log("Contacting game server, after transfer token event recieved ");
    console.log("Post Data:", postData);
    axios
      .post(apiUrl, postData)
      .then((response) => {
        console.log("Response:", response.data);
      })
      .catch((error) => {
        console.error("Error:", error.message);
      });
  } catch (error) {
    console.log(`Error In Sending TransferEventPacket ${error.message}`);
  }
  console.log("#############################################################\n\n");
};

module.exports = { sendTokenTransferEvent };
