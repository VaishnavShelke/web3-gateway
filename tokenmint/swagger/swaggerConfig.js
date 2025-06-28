const swaggerJsdoc = require('swagger-jsdoc');
const { dynamicContractHandler } = require('../handlers/dynamicContractHandler');

// Base swagger definition
const baseSwaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Web3 Gateway Dynamic Contract API',
    version: '1.0.0',
    description: `
      Dynamic API interface for smart contract interactions.
      
      This API automatically generates endpoints based on your contract's ABI.
      All contract functions are accessible through RESTful endpoints with automatic type validation.
      
      **Environment Variables Required:**
      - CONTRACT_ABI_GITHUB_URL: GitHub raw URL to your contract ABI
      - CONTRACT_OWNER_PRIVATE_KEY: Private key for signing transactions
      - TOKEN_MINT_CONTRACT_ADDRESS: Contract address
      - ALCHEMY_API_KEY: Alchemy API key
    `,
    contact: {
      name: 'Web3 Gateway API',
    },
  },
  servers: [
    {
      url: 'http://localhost:2001',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error description',
          },
        },
      },
      ContractInfo: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              contractAddress: {
                type: 'string',
                example: '0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d',
              },
              functions: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/ContractFunction',
                },
              },
              events: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/ContractEvent',
                },
              },
              abi: {
                type: 'array',
                description: 'Complete contract ABI',
              },
            },
          },
        },
      },
      ContractFunction: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'balanceOf',
          },
          inputs: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/FunctionParameter',
            },
          },
          outputs: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/FunctionParameter',
            },
          },
          stateMutability: {
            type: 'string',
            enum: ['view', 'pure', 'nonpayable', 'payable'],
            example: 'view',
          },
          isReadOnly: {
            type: 'boolean',
            example: true,
          },
          isWrite: {
            type: 'boolean',
            example: false,
          },
        },
      },
      FunctionParameter: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'owner',
          },
          type: {
            type: 'string',
            example: 'address',
          },
          internalType: {
            type: 'string',
            example: 'address',
          },
        },
      },
      ContractEvent: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Transfer',
          },
          inputs: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/FunctionParameter',
            },
          },
          anonymous: {
            type: 'boolean',
            example: false,
          },
        },
      },
      ReadFunctionRequest: {
        type: 'object',
        properties: {
          params: {
            type: 'array',
            description: 'Function parameters in order',
            example: ['0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d', '1'],
          },
        },
      },
      WriteFunctionRequest: {
        type: 'object',
        properties: {
          params: {
            type: 'array',
            description: 'Function parameters in order',
            example: ['0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d', '1', '100'],
          },
          overrides: {
            $ref: '#/components/schemas/TransactionOverrides',
          },
        },
      },
      TransactionOverrides: {
        type: 'object',
        properties: {
          gasLimit: {
            type: 'string',
            example: '300000',
            description: 'Gas limit for the transaction',
          },
          gasPrice: {
            type: 'string',
            example: '20000000000',
            description: 'Gas price in wei',
          },
          maxFeePerGas: {
            type: 'string',
            example: '30000000000',
            description: 'Maximum fee per gas (EIP-1559)',
          },
          maxPriorityFeePerGas: {
            type: 'string',
            example: '2000000000',
            description: 'Maximum priority fee per gas (EIP-1559)',
          },
          value: {
            type: 'string',
            example: '0',
            description: 'ETH value to send (in wei)',
          },
          nonce: {
            type: 'integer',
            example: 42,
            description: 'Transaction nonce',
          },
        },
      },
      BatchReadRequest: {
        type: 'object',
        properties: {
          calls: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                functionName: {
                  type: 'string',
                  example: 'balanceOf',
                },
                params: {
                  type: 'array',
                  example: ['0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d', '1'],
                },
              },
            },
          },
        },
      },
      TransactionResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          function: {
            type: 'string',
            example: 'safeTransferFrom',
          },
          parameters: {
            type: 'array',
            example: ['0x...', '0x...', '1', '100', '0x'],
          },
          transactionHash: {
            type: 'string',
            example: '0x1234567890abcdef...',
          },
          blockNumber: {
            type: 'integer',
            example: 12345678,
          },
          gasUsed: {
            type: 'string',
            example: '84523',
          },
          effectiveGasPrice: {
            type: 'string',
            example: '20000000000',
          },
          signature: {
            type: 'string',
            example: 'safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
          },
        },
      },
    },
  },
};

// Generate Solidity type schema for parameters
function getSolidityTypeSchema(type) {
  if (type === 'address') {
    return {
      type: 'string',
      pattern: '^0x[a-fA-F0-9]{40}$',
      example: '0x742d35Cc6634C0532925a3b8D398B94cc5f5dc7d',
      description: 'Ethereum address',
    };
  }
  
  if (type.includes('uint') || type.includes('int')) {
    return {
      type: 'string',
      pattern: '^[0-9]+$',
      example: '1000000000000000000',
      description: 'Integer value (as string to handle large numbers)',
    };
  }
  
  if (type === 'bool') {
    return {
      type: 'boolean',
      example: true,
      description: 'Boolean value',
    };
  }
  
  if (type.includes('bytes')) {
    return {
      type: 'string',
      pattern: '^0x[a-fA-F0-9]*$',
      example: '0x1234567890abcdef',
      description: 'Hex-encoded bytes',
    };
  }
  
  if (type === 'string') {
    return {
      type: 'string',
      example: 'Hello World',
      description: 'String value',
    };
  }
  
  if (type.includes('[')) {
    const baseType = type.replace(/\[\d*\]$/, '');
    return {
      type: 'array',
      items: getSolidityTypeSchema(baseType),
      description: `Array of ${baseType}`,
    };
  }
  
  // Default for unknown types
  return {
    type: 'string',
    description: `Value of type ${type}`,
  };
}

// Generate dynamic paths based on contract functions
async function generateDynamicPaths() {
  try {
    await dynamicContractHandler.initialize();
    const functions = dynamicContractHandler.getFunctionDetails();
    const paths = {};

    // Add static paths first
    paths['/web3-gateway/contract/info'] = {
      get: {
        tags: ['Contract Information'],
        summary: 'Get complete contract information',
        description: 'Returns contract address, ABI, all available functions and events',
        responses: {
          '200': {
            description: 'Contract information retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ContractInfo',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    };

    paths['/web3-gateway/contract/functions'] = {
      get: {
        tags: ['Contract Information'],
        summary: 'Get all available functions',
        description: 'Returns all contract functions categorized by type (read-only vs write)',
        responses: {
          '200': {
            description: 'Functions retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    functions: {
                      type: 'object',
                      properties: {
                        readOnly: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ContractFunction' },
                        },
                        write: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ContractFunction' },
                        },
                        all: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ContractFunction' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    // Generate dynamic function endpoints
    functions.forEach(func => {
      const functionName = func.name;
      const isReadOnly = func.isReadOnly;
      
      // Create parameter schema for this function
      const parameterSchema = {
        type: 'object',
        properties: {
          params: {
            type: 'array',
            description: `Parameters for ${functionName} function`,
            items: {
              oneOf: func.inputs.map(input => ({
                ...getSolidityTypeSchema(input.type),
                description: `${input.name} (${input.type})`,
              })),
            },
            example: func.inputs.map(input => {
              const schema = getSolidityTypeSchema(input.type);
              return schema.example;
            }),
          },
        },
      };

      if (isReadOnly) {
        // Read function endpoint
        paths[`/web3-gateway/contract/read/${functionName}`] = {
          post: {
            tags: ['Read Functions'],
            summary: `Call ${functionName} (Read-Only)`,
            description: `Call the read-only function ${functionName}. 
            
**Function Signature:** \`${func.name}(${func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})${func.outputs && func.outputs.length > 0 ? ` returns (${func.outputs.map(o => `${o.type}${o.name ? ` ${o.name}` : ''}`).join(', ')})` : ''}\`

**Parameters:**
${func.inputs.map(input => `- **${input.name}** (\`${input.type}\`): ${input.type === 'address' ? 'Ethereum address' : input.type.includes('uint') ? 'Integer value' : input.type === 'bool' ? 'Boolean value' : 'Parameter value'}`).join('\n')}

${func.outputs && func.outputs.length > 0 ? `**Returns:**
${func.outputs.map(output => `- **${output.name || 'result'}** (\`${output.type}\`)`).join('\n')}` : ''}`,
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: parameterSchema,
                },
              },
            },
            responses: {
              '200': {
                description: 'Function executed successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true },
                        function: { type: 'string', example: functionName },
                        parameters: { type: 'array' },
                        result: { 
                          description: 'Function return value',
                          example: func.outputs && func.outputs.length === 1 ? getSolidityTypeSchema(func.outputs[0].type).example : {}
                        },
                        signature: { type: 'string' },
                      },
                    },
                  },
                },
              },
              '400': {
                description: 'Invalid parameters or function not found',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' },
                  },
                },
              },
              '500': {
                description: 'Internal server error',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' },
                  },
                },
              },
            },
          },
        };
      } else {
        // Write function endpoint
        const writeParameterSchema = {
          type: 'object',
          properties: {
            params: parameterSchema.properties.params,
            overrides: {
              $ref: '#/components/schemas/TransactionOverrides',
            },
          },
        };

        paths[`/web3-gateway/contract/write/${functionName}`] = {
          post: {
            tags: ['Write Functions'],
            summary: `Call ${functionName} (State-Changing)`,
            description: `Call the state-changing function ${functionName}. Requires gas and creates a blockchain transaction.
            
**Function Signature:** \`${func.name}(${func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})${func.outputs && func.outputs.length > 0 ? ` returns (${func.outputs.map(o => `${o.type}${o.name ? ` ${o.name}` : ''}`).join(', ')})` : ''}\`

**Parameters:**
${func.inputs.map(input => `- **${input.name}** (\`${input.type}\`): ${input.type === 'address' ? 'Ethereum address' : input.type.includes('uint') ? 'Integer value' : input.type === 'bool' ? 'Boolean value' : 'Parameter value'}`).join('\n')}

**Transaction Overrides:**
- **gasLimit**: Gas limit for the transaction
- **gasPrice**: Gas price in wei
- **value**: ETH value to send (in wei)`,
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: writeParameterSchema,
                },
              },
            },
            responses: {
              '200': {
                description: 'Transaction executed successfully',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/TransactionResponse' },
                  },
                },
              },
              '400': {
                description: 'Invalid parameters or function not found',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' },
                  },
                },
              },
              '500': {
                description: 'Transaction failed or internal server error',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' },
                  },
                },
              },
            },
          },
        };
      }

      // Function details endpoint
      paths[`/web3-gateway/contract/functions/${functionName}`] = {
        get: {
          tags: ['Contract Information'],
          summary: `Get ${functionName} function details`,
          description: `Get detailed information about the ${functionName} function including parameters and return types`,
          responses: {
            '200': {
              description: 'Function details retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      function: { $ref: '#/components/schemas/ContractFunction' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Function not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      };
    });

    // Add batch read endpoint
    paths['/web3-gateway/contract/batch/read'] = {
      post: {
        tags: ['Batch Operations'],
        summary: 'Batch call multiple read functions',
        description: 'Execute multiple read-only function calls in a single request for better efficiency',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BatchReadRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Batch operations completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          functionName: { type: 'string' },
                          params: { type: 'array' },
                          success: { type: 'boolean' },
                          result: { description: 'Function result if successful' },
                          error: { type: 'string', description: 'Error message if failed' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    return paths;
  } catch (error) {
    console.error('Error generating dynamic paths:', error);
    return {};
  }
}

// Create swagger spec with dynamic paths
async function createSwaggerSpec() {
  const paths = await generateDynamicPaths();
  
  return {
    ...baseSwaggerDef,
    paths,
  };
}

module.exports = {
  createSwaggerSpec,
  getSolidityTypeSchema,
  generateDynamicPaths,
};