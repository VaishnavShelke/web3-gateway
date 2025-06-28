const express = require("express");
const app = express();
const port = 2001;

const {
  errorHandlerMiddleware,
  requestLogger,
  responseLogger,
} = require("./tokenmint/middleware/customMiddleWares");

// Debug logging for middleware setup
console.debug('Setting up middleware...');

app.use(express.json());
app.use(requestLogger);
app.use(responseLogger);
app.use(errorHandlerMiddleware);

// Debug logging for route setup
console.debug('Setting up routes...');

app.get("/", (req, res) => {
  console.debug('Home route accessed');
  res.send("Home Page");
});

const utilityRoutes = require("./tokenmint/routes/utilityRoutes.js");
const tokenMintRoutes = require("./tokenmint/routes/tokenMintRoutes.js");
const dynamicContractRoutes = require("./tokenmint/routes/dynamicContractRoutes.js");
app.use("/utility", utilityRoutes);
app.use("/web3-gateway/tokenmint", tokenMintRoutes);
app.use("/web3-gateway/contract", dynamicContractRoutes);

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

app.listen(port, () => {
  console.debug(`Server starting on port ${port}`);
  console.log(`Node Server Started!!! on port ${port}`);
});
