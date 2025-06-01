// Expected Transfer event signature
const EXPECTED_TRANSFER_EVENT = {
  name: "Transfer",
  inputs: [
    { name: "sender", type: "address", indexed: false },
    { name: "from", type: "address", indexed: false },
    { name: "to", type: "address", indexed: false },
    { name: "id", type: "uint256", indexed: false },
    { name: "value", type: "uint256", indexed: false },
    { name: "data", type: "bytes", indexed: false }
  ]
};

function compareEventSignatures(expected, actual) {
  // Check event name
  if (expected.name !== actual.name) {
    console.error(`Event name mismatch. Expected: ${expected.name}, Got: ${actual.name}`);
    return false;
  }

  // Check number of inputs
  if (expected.inputs.length !== actual.inputs.length) {
    console.error(`Number of inputs mismatch. Expected: ${expected.inputs.length}, Got: ${actual.inputs.length}`);
    return false;
  }

  // Check each input parameter
  for (let i = 0; i < expected.inputs.length; i++) {
    const expectedInput = expected.inputs[i];
    const actualInput = actual.inputs[i];

    if (expectedInput.name !== actualInput.name) {
      console.error(`Input ${i} name mismatch. Expected: ${expectedInput.name}, Got: ${actualInput.name}`);
      return false;
    }

    if (expectedInput.type !== actualInput.type) {
      console.error(`Input ${i} type mismatch. Expected: ${expectedInput.type}, Got: ${actualInput.type}`);
      return false;
    }

    if (expectedInput.indexed !== actualInput.indexed) {
      console.error(`Input ${i} indexed mismatch. Expected: ${expectedInput.indexed}, Got: ${actualInput.indexed}`);
      return false;
    }
  }

  return true;
}

async function checkContractEvents(contract) {
  try {
    // Get the contract's interface
    const contractInterface = contract.interface;
    
    // Get all event names
    const eventNames = Object.keys(contractInterface.events);
    console.log('Available events:', eventNames);
    
    // Find the Transfer event by its full signature
    const transferEventKey = eventNames.find(key => key.startsWith('Transfer('));
    
    if (!transferEventKey) {
      console.error('Transfer event not found in contract interface');
      return false;
    }

    // Get event details
    const transferEvent = contractInterface.events[transferEventKey];
    console.log('Transfer event found in contract:');
    console.log('- Event name:', transferEvent.name);
    console.log('- Event inputs:', JSON.stringify(transferEvent.inputs));
    
    // Check if event signature matches expected format
    const signatureMatches = compareEventSignatures(EXPECTED_TRANSFER_EVENT, {
      name: transferEvent.name,
      inputs: transferEvent.inputs
    });

    if (!signatureMatches) {
      console.error('Transfer event signature does not match expected format');
      return false;
    }

    console.log('Transfer event signature matches expected format');
    return true;
  } catch (error) {
    console.error('Error checking contract events:', error);
    return false;
  }
}

module.exports = {
  EXPECTED_TRANSFER_EVENT,
  compareEventSignatures,
  checkContractEvents
}; 