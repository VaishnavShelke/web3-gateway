const swaggerUi = require('swagger-ui-express');
const { createSwaggerSpec } = require('./swaggerConfig');

// Swagger middleware setup
async function setupSwagger(app) {
  try {
    // Generate swagger spec with dynamic contract functions
    const swaggerSpec = await createSwaggerSpec();
    
    // Swagger UI options
    const swaggerOptions = {
      explorer: true,
      swaggerOptions: {
        validatorUrl: null,
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
          // Add any request interceptors here if needed
          return req;
        },
        responseInterceptor: (res) => {
          // Add any response interceptors here if needed
          return res;
        },
      },
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin-bottom: 20px }
        .swagger-ui .scheme-container { background: #fafafa; padding: 10px; border-radius: 4px; margin-bottom: 20px }
        .swagger-ui .info .title { color: #3b4151; font-size: 36px }
        .swagger-ui .info .description { color: #3b4151; font-size: 14px; line-height: 1.6 }
        .swagger-ui .opblock.opblock-post { border-color: #49cc90; background: rgba(73,204,144,.1) }
        .swagger-ui .opblock.opblock-get { border-color: #61affe; background: rgba(97,175,254,.1) }
        .swagger-ui .opblock .opblock-summary-method { background: #61affe; color: #fff }
        .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90 }
      `,
      customSiteTitle: 'Web3 Gateway API Documentation',
      customfavIcon: '/favicon.ico',
    };

    // Serve swagger documentation
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerOptions));
    
    // Also serve the raw swagger spec as JSON
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // Endpoint to refresh swagger documentation (useful when contract ABI changes)
    app.get('/api-docs/refresh', async (req, res) => {
      try {
        const newSwaggerSpec = await createSwaggerSpec();
        // Update the served spec
        app._router.stack = app._router.stack.filter(layer => 
          !layer.route || layer.route.path !== '/api-docs'
        );
        app.get('/api-docs', swaggerUi.setup(newSwaggerSpec, swaggerOptions));
        
        res.json({
          success: true,
          message: 'Swagger documentation refreshed successfully',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: `Failed to refresh documentation: ${error.message}`,
        });
      }
    });

    console.log('Swagger documentation available at: http://localhost:2001/api-docs');
    console.log('Swagger spec JSON available at: http://localhost:2001/api-docs.json');
    console.log('Refresh documentation at: http://localhost:2001/api-docs/refresh');
    
    return true;
  } catch (error) {
    console.error('Error setting up Swagger:', error);
    return false;
  }
}

// Health check endpoint for swagger
function addHealthCheck(app) {
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      swagger: {
        available: true,
        url: '/api-docs',
        refreshUrl: '/api-docs/refresh',
      },
    });
  });
}

module.exports = {
  setupSwagger,
  addHealthCheck,
};