const errorHandlerMiddleware = (err, req, res, next) => {
  console.log(`Unexpected Error In Routes ${err}`);
  next();
};

const requestLogger = (req, res, next) => {
  console.log(`Recieved Request on Url ${req.originalUrl}`);
  console.log(`Request Body == ${JSON.stringify(req.body)}`);
  next();
};

const responseLogger = (req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`Response Body == ${body}`);
    originalSend.call(this, body);
  };
  next();
};

module.exports = { errorHandlerMiddleware, requestLogger, responseLogger };
