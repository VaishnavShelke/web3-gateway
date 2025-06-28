// Middleware for swagger-related functionality

// CORS middleware specifically for API documentation
function swaggerCorsMiddleware(req, res, next) {
  // Allow CORS for swagger documentation
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}

// Middleware to catch swagger initialization errors
function swaggerErrorHandler(req, res, next) {
  if (req.path.startsWith('/api-docs')) {
    res.on('error', (error) => {
      console.error('Swagger error:', error);
      res.status(500).json({
        success: false,
        message: 'API documentation is temporarily unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    });
  }
  next();
}

// Security headers for swagger
function swaggerSecurityHeaders(req, res, next) {
  if (req.path.startsWith('/api-docs')) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }
  next();
}

// Rate limiting for swagger endpoints (simple implementation)
const swaggerRateLimit = (() => {
  const requests = new Map();
  const WINDOW_SIZE = 60000; // 1 minute
  const MAX_REQUESTS = 100; // Max 100 requests per minute per IP

  return (req, res, next) => {
    if (!req.path.startsWith('/api-docs')) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const ipRequests = requests.get(ip);
    
    // Remove old requests outside the window
    const validRequests = ipRequests.filter(time => now - time < WINDOW_SIZE);
    
    if (validRequests.length >= MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests to API documentation. Please try again later.',
        retryAfter: Math.ceil(WINDOW_SIZE / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(ip, validRequests);
    
    next();
  };
})();

// Swagger analytics middleware
function swaggerAnalytics(req, res, next) {
  if (req.path.startsWith('/api-docs')) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`[Swagger] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
    });
  }
  next();
}

module.exports = {
  swaggerCorsMiddleware,
  swaggerErrorHandler,
  swaggerSecurityHeaders,
  swaggerRateLimit,
  swaggerAnalytics
};