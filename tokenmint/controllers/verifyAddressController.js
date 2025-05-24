const {
  STATUS_CODE_SUCCESS,
  STATUS_CODE_INVALID_FIELD,
  ACCOUNT_VERIFICATION_FAILED,
} = require("../utils/constants.js");

const { getSignerAddressUtil } = require("../utils/etherUtils.js");
const asyncHandler = require("express-async-handler");

const verifyAddressHandler = asyncHandler(async (req, res) => {
  try {
    const { message, signedMessage, address } = req.body;
    if (!message || !signedMessage || !address) {
      res.status(400);
      res.json({ statusCode: STATUS_CODE_INVALID_FIELD, ...req.body });
    }

    const signerAddress = await getSignerAddressUtil(
      message,
      signedMessage,
      address
    );
    if (
      signerAddress &&
      signerAddress.toLocaleLowerCase() === address.toLocaleLowerCase()
    ) {
      res.json({
        statusCode: STATUS_CODE_SUCCESS,
        statusDesc: "Account Verified",
        ...req.body,
      });
    } else {
      res.json({
        statusCode: ACCOUNT_VERIFICATION_FAILED,
        statusDesc: "Account Not The Signer of Message",
        signerAddress: signerAddress,
        ...req.body,
      });
    }
  } catch (err) {
    console.log(`Error in verifyAddressHandler ${err} `);
    res.status(500);
  }
});

module.exports = { verifyAddressHandler };
