require('dotenv').config();

const moveTokenHandler = async ({
  operatorWallet,
  contract,
  from,
  to,
  id,
  value,
  data,
}) => {
  // Validate token ID
  if (id < 1 || id > 4) {
    throw new Error('Invalid token ID. Must be between 1 and 4');
  }

  const balance = await contract.balanceOf(from, id);

  console.log(`\nReading from ${from}\n`);
  console.log(`Balance of sender: ${balance}\n`);

  // Check if sender has sufficient balance
  if (balance.lt(value)) {
    throw new Error(`Insufficient balance. Required: ${value}, Available: ${balance}`);
  }

  const contractWithWallet = contract.connect(operatorWallet);

  // Set manual gas limit and gas price
  const gasLimit = 200000; // Increased gas limit for safety
  const gasPrice = await operatorWallet.provider.getGasPrice();
  
  const tx = await contractWithWallet.safeTransferFrom(
    from,
    to,
    id,
    value,
    data,
    {
      gasLimit: gasLimit,
      maxFeePerGas: gasPrice.mul(2),
      maxPriorityFeePerGas: gasPrice.div(2)
    }
  );
  
  console.log(`Transaction sent with gas limit: ${gasLimit}`);
  const txReciept = await tx.wait();

  console.log(`Transaction Receipt:`, JSON.stringify(txReciept));

  const balanceOfSender = await contract.balanceOf(from, id);
  const balanceOfReciever = await contract.balanceOf(to, id);

  console.log(`\nBalance of sender: ${balanceOfSender}`);
  console.log(`Balance of reciever: ${balanceOfReciever}\n`);
  return txReciept;
};

module.exports = { moveTokenHandler };
