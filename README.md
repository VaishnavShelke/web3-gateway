# Web3 Gateway

**The WEB3 Gateway For Games** - A dynamic smart contract interaction API with auto-generated documentation.

## 🚀 Features

### **Dynamic Contract Interface**
- 🎯 **Auto-generated APIs** based on your contract's ABI from GitHub
- 🔄 **Real-time updates** when contract ABI changes
- 🛡️ **Type-safe parameter validation** for all Solidity types
- ⚡ **Gas optimization** with smart estimation and buffers
- 📦 **Batch operations** for efficient multiple function calls
- 🔐 **Secure transaction signing** with private key management

### **Interactive API Documentation**
- 📖 **Swagger UI** with live testing capabilities
- 🎨 **Auto-generated documentation** from contract ABI
- 🔍 **Function introspection** with parameter details
- 📊 **Real-time refresh** when contract changes
- 🛡️ **Security headers** and rate limiting
- 📈 **Analytics and monitoring** for API usage

## 🏁 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Ethereum wallet private key
- Alchemy API key
- Contract ABI hosted on GitHub

### Installation

```bash
# Clone the repository
git clone https://github.com/VaishnavShelke/web3-gateway.git
cd web3-gateway

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)

# Start the server
npm start
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Blockchain Configuration
ALCHEMY_API_KEY=your_alchemy_api_key_here
CONTRACT_OWNER_PRIVATE_KEY=your_private_key_here
TOKEN_MINT_CONTRACT_ADDRESS=0xYourContractAddress
CONTRACT_ABI_GITHUB_URL=https://raw.githubusercontent.com/your-repo/abi.json

# Server Configuration (Optional)
PORT=2001
NODE_ENV=development

# Token Bridge Server (If using existing token bridge)
TRANSFER_TOKEN_EVENT_TBS_ENDPOINT=http://token-bridge-server:1001/tokenmint/server/internal/eventlistener/transferevent
```

## 📖 API Documentation

Once running, access the interactive documentation at:

- **Swagger UI**: http://localhost:2001/api-docs
- **API Spec JSON**: http://localhost:2001/api-docs.json
- **Health Check**: http://localhost:2001/health
- **Home Page**: http://localhost:2001/

### API Endpoints Overview

| Category | Endpoint | Method | Description |
|----------|----------|---------|-------------|
| **Documentation** | `/api-docs` | GET | Interactive Swagger UI |
| **Contract Info** | `/web3-gateway/contract/info` | GET | Complete contract information |
| **Function List** | `/web3-gateway/contract/functions` | GET | All available functions |
| **Function Details** | `/web3-gateway/contract/functions/{name}` | GET | Specific function details |
| **Read Functions** | `/web3-gateway/contract/read/{name}` | POST | Call view/pure functions |
| **Write Functions** | `/web3-gateway/contract/write/{name}` | POST | Call state-changing functions |
| **Batch Read** | `/web3-gateway/contract/batch/read` | POST | Multiple read operations |
| **Health Check** | `/health` | GET | API status and info |

## 🎯 Usage Examples

### 1. Get Contract Information
```bash
curl -X GET http://localhost:2001/web3-gateway/contract/info
```

### 2. Call a Read-Only Function (e.g., `balanceOf`)
```bash
curl -X POST http://localhost:2001/web3-gateway/contract/read/balanceOf \
  -H "Content-Type: application/json" \
  -d '{
    "params": ["0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d", "1"]
  }'
```

### 3. Call a Write Function (e.g., `safeTransferFrom`)
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

### 4. Batch Read Multiple Functions
```bash
curl -X POST http://localhost:2001/web3-gateway/contract/batch/read \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### 5. Refresh Documentation After ABI Update
```bash
curl -X GET http://localhost:2001/api-docs/refresh
```

## 🔧 Parameter Types

The API automatically validates and converts parameters based on Solidity types:

| Solidity Type | Input Format | Example |
|---------------|--------------|---------|
| `address` | Ethereum address string | `"0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d"` |
| `uint256` | Number or string | `"1000000000000000000"` or `1000` |
| `bool` | Boolean or string | `true`, `false`, `"true"`, `"false"` |
| `bytes` | Hex string | `"0x1234567890abcdef"` |
| `string` | Text string | `"Hello World"` |
| `uint256[]` | Array of numbers | `["1", "2", "3"]` |

## 🏗️ Development

### Project Structure
```
web3-gateway/
├── index.js                          # Main server file
├── package.json                      # Dependencies and scripts
├── tokenmint/
│   ├── controllers/
│   │   ├── dynamicContractController.js    # Dynamic API controllers
│   │   └── contractInterfaceController.js  # Legacy controllers
│   ├── handlers/
│   │   ├── dynamicContractHandler.js       # Core contract handler
│   │   ├── initContractService.js          # Contract initialization
│   │   └── contractEventListenerHandler.js # Event listening
│   ├── routes/
│   │   ├── dynamicContractRoutes.js        # Dynamic API routes
│   │   └── tokenMintRoutes.js              # Legacy routes
│   ├── utils/
│   │   ├── contractTypeUtils.js            # Type validation utilities
│   │   ├── etherUtils.js                   # Ethereum utilities
│   │   └── githubUtils.js                  # GitHub ABI fetching
│   ├── middleware/
│   │   ├── swaggerMiddleware.js            # Swagger security & analytics
│   │   └── customMiddleWares.js            # Custom middleware
│   └── swagger/
│       ├── swaggerConfig.js                # Dynamic swagger config
│       └── swaggerSetup.js                 # Swagger setup
├── DYNAMIC_CONTRACT_USAGE.md         # Detailed API usage guide
└── README.md                         # This file
```

### Adding New Features

1. **Extend Contract Handler**: Modify `dynamicContractHandler.js` for new functionality
2. **Add API Endpoints**: Create new routes in `dynamicContractRoutes.js`
3. **Update Documentation**: Swagger docs auto-update from ABI changes
4. **Add Utilities**: Place helper functions in appropriate `utils/` files

### Running in Development

```bash
# Install dependencies
npm install

# Start with auto-reload
npm start

# Or use nodemon directly
npx nodemon index.js
```

## 🐳 Docker Support

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t web3-gateway .
docker run -p 2001:2001 --env-file .env web3-gateway
```

## 🔍 Monitoring & Health

### Health Check Endpoint
```bash
curl http://localhost:2001/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "swagger": {
    "available": true,
    "url": "/api-docs",
    "refreshUrl": "/api-docs/refresh"
  }
}
```

### API Analytics
- Request logging with timing information
- Rate limiting (100 requests/minute per IP for docs)
- Error tracking and reporting
- Swagger usage analytics

## 🛡️ Security Features

- **Parameter Validation**: All inputs validated against Solidity types
- **Rate Limiting**: Protection against API abuse
- **Security Headers**: XSS protection, content type validation
- **Private Key Protection**: Secure transaction signing
- **CORS Configuration**: Controlled cross-origin access

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Branches
- `main` - Production ready code
- `u/vshelke/contract-client` - Dynamic contract interface
- `u/vshelke/swagger-integration` - Swagger documentation

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ethers.js** for Ethereum interaction
- **Express.js** for the REST API framework
- **Swagger UI** for interactive documentation
- **Alchemy** for blockchain infrastructure

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the [API Documentation](http://localhost:2001/api-docs) for usage examples
- Review the [Detailed Usage Guide](DYNAMIC_CONTRACT_USAGE.md)

---

**Built for Web3 Game Developers** 🎮⚡
