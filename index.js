const express = require("express");
const app = express();
const port = 2001;

const {
  errorHandlerMiddleware,
  requestLogger,
  responseLogger,
} = require("./tokenmint/middleware/customMiddleWares");

const { setupSwagger, addHealthCheck } = require("./tokenmint/swagger/swaggerSetup");
const { 
  swaggerCorsMiddleware, 
  swaggerErrorHandler, 
  swaggerSecurityHeaders, 
  swaggerRateLimit, 
  swaggerAnalytics 
} = require("./tokenmint/middleware/swaggerMiddleware");

// Debug logging for middleware setup
console.debug('Setting up middleware...');

app.use(express.json());
app.use(requestLogger);
app.use(responseLogger);
app.use(errorHandlerMiddleware);

// Swagger-specific middleware
app.use(swaggerCorsMiddleware);
app.use(swaggerErrorHandler);
app.use(swaggerSecurityHeaders);
app.use(swaggerRateLimit);
app.use(swaggerAnalytics);

// Debug logging for route setup
console.debug('Setting up routes...');

app.get("/", (req, res) => {
  console.debug('Home route accessed');
  res.send(`
    <h1>Web3 Gateway</h1>
    <p>Welcome to the Web3 Gateway API</p>
    <ul>
      <li><a href="/api-docs">API Documentation (Swagger)</a></li>
      <li><a href="/health">Health Check</a></li>
      <li><a href="/web3-gateway/contract/info">Contract Information</a></li>
    </ul>
  `);
});

const utilityRoutes = require("./tokenmint/routes/utilityRoutes.js");
const tokenMintRoutes = require("./tokenmint/routes/tokenMintRoutes.js");
const dynamicContractRoutes = require("./tokenmint/routes/dynamicContractRoutes.js");
app.use("/utility", utilityRoutes);
app.use("/web3-gateway/tokenmint", tokenMintRoutes);
app.use("/web3-gateway/contract", dynamicContractRoutes);

// Add health check endpoint
addHealthCheck(app);

// Debug logging for contract event listener
console.debug('Initializing contract event listener...');

const { startEventListener } = require("./tokenmint/handlers/contractEventListenerHandler.js");
startEventListener()
  .then(() => {
    console.debug('Contract event listener initialized successfully');
    console.log("Event Listener Initialized");
  })
  .catch((error) => {
    console.error('Failed to initialize contract event listener:', error);
    console.log(`Error in initializing contract EventListener ${error}`);
  });

app.listen(port, async () => {
  console.debug(`Server starting on port ${port}`);
  console.log(`Node Server Started!!! on port ${port}`);
  
  // Setup Swagger documentation
  console.debug('Setting up Swagger documentation...');
  const swaggerSetup = await setupSwagger(app);
  if (swaggerSetup) {
    console.log('✅ Swagger documentation setup completed');
  } else {
    console.error('❌ Failed to setup Swagger documentation');
  }
});
