# Dynamic Contract Interface API

This module provides a dynamic interface to interact with your smart contract based on the ABI fetched from GitHub. The APIs are automatically generated based on the contract's ABI contents.

## Base URL
All endpoints are prefixed with: `/web3-gateway/contract`

## Available Endpoints

### 1. Get Contract Information
**GET** `/info`

Returns complete contract information including ABI, functions, and events.

**Response:**
```json
{
  "success": true,
  "data": {
    "contractAddress": "0x...",
    "functions": [...],
    "events": [...],
    "abi": [...]
  }
}
```

### 2. Get All Functions
**GET** `/functions`

Returns all available functions categorized by type (read-only vs write).

**Response:**
```json
{
  "success": true,
  "functions": {
    "readOnly": [...],
    "write": [...],
    "all": [...]
  }
}
```

### 3. Get Specific Function Details
**GET** `/functions/{functionName}`

Returns details for a specific function.

### 4. Call Read-Only Functions
**POST** `/read/{functionName}`

Call view/pure functions that don't modify blockchain state.

**Request Body:**
```json
{
  "params": [/* function parameters */]
}
```

**Example - Call `balanceOf` function:**
```bash
curl -X POST http://localhost:2001/web3-gateway/contract/read/balanceOf \
  -H "Content-Type: application/json" \
  -d '{
    "params": ["0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d", "1"]
  }'
```

### 5. Call Write Functions
**POST** `/write/{functionName}`

Call functions that modify blockchain state (requires gas).

**Request Body:**
```json
{
  "params": [/* function parameters */],
  "overrides": {
    "gasLimit": "300000",
    "gasPrice": "20000000000",
    "value": "0"
  }
}
```

**Example - Call `safeTransferFrom` function:**
```bash
curl -X POST http://localhost:2001/web3-gateway/contract/write/safeTransferFrom \
  -H "Content-Type: application/json" \
  -d '{
    "params": [
      "0x17a8dD0d3199ae2c59dC96578a6B5bEFAF963db3",
      "0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d",
      "1",
      "100",
      "0x"
    ],
    "overrides": {
      "gasLimit": "500000"
    }
  }'
```

### 6. Batch Read Functions
**POST** `/batch/read`

Call multiple read-only functions in a single request.

**Request Body:**
```json
{
  "calls": [
    {
      "functionName": "balanceOf",
      "params": ["0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d", "1"]
    },
    {
      "functionName": "uri",
      "params": ["1"]
    }
  ]
}
```

## Parameter Types

The API automatically validates and converts parameters based on Solidity types:

- **address**: Must be a valid Ethereum address (gets checksummed)
- **uint256/int256**: Numbers or numeric strings (converted to BigNumber)
- **bool**: Boolean values, "true"/"false" strings, or numbers (0 = false, non-zero = true)
- **bytes/bytes32**: Hex strings
- **string**: Text strings
- **arrays**: JSON arrays with elements of the appropriate type

## Transaction Overrides

For write functions, you can specify transaction parameters:

- `gasLimit`: Gas limit for the transaction
- `gasPrice`: Gas price in wei
- `maxFeePerGas`: Maximum fee per gas (EIP-1559)
- `maxPriorityFeePerGas`: Maximum priority fee per gas (EIP-1559)
- `value`: ETH value to send with transaction (in wei)
- `nonce`: Transaction nonce (optional)

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Environment Variables Required

Make sure these are set in your `.env` file:
- `CONTRACT_ABI_GITHUB_URL`: Raw GitHub URL to your contract ABI JSON
- `CONTRACT_OWNER_PRIVATE_KEY`: Private key for signing transactions
- `TOKEN_MINT_CONTRACT_ADDRESS`: Contract address to interact with
- `ALCHEMY_API_KEY`: Your Alchemy API key

## Example Usage Flow

1. **Get contract info** to see available functions
2. **Get function details** to understand required parameters
3. **Call read functions** to query contract state
4. **Call write functions** to modify contract state
5. **Use batch reads** for efficient multiple queries

The interface is completely dynamic - as you update your contract ABI on GitHub, the API endpoints automatically adapt to the new contract structure! 