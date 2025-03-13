const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { MongoClient } = require('mongodb');

// MongoDB Connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';
const DEFAULT_DATABASE = process.env.DEFAULT_DATABASE || 'GondiCustomerDb';

// Check if MongoDB URI is provided
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required');
  console.error('Please set it in Claude Desktop configuration as:');
  console.error('"env": { "MONGODB_URI": "mongodb+srv://username:password@host" }');
  process.exit(1);
}

let mongoClient = null;

// Create MCP server
const server = new Server(
  { name: 'mongo-simple-server', version: '1.0.0' },
  {
    capabilities: {
      tools: {
        'aggregate': {},
        'sample': {},
        'explain': {}
      }
    }
  }
);

// Log our progress to help with debugging
console.error('Starting MongoDB MCP Server');

// Helper to ensure MongoDB connection
async function getMongoClient() {
  console.error('Getting MongoDB client');
  if (!mongoClient) {
    console.error(`Connecting to MongoDB...`);
    try {
      mongoClient = new MongoClient(MONGODB_URI);
      await mongoClient.connect();
      console.error('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
  return mongoClient;
}

// Setup fallback request handler
server.fallbackRequestHandler = async (request) => {
  const { method, params } = request;
  console.error(`Received request: ${method}`);

  try {
    // Handle initialization and basic methods
    if (method === 'tools/list') {
      return {
        tools: [
          {
            name: 'aggregate',
            description: 'Run a MongoDB aggregation pipeline',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to query'
                },
                pipeline: {
                  type: 'array',
                  items: { type: 'object' },
                  description: 'MongoDB aggregation pipeline stages'
                }
              },
              required: ['collection', 'pipeline']
            }
          },
          {
            name: 'sample',
            description: 'Get random sample documents from a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to sample from'
                },
                count: {
                  type: 'number',
                  description: 'Number of documents to sample (default: 5, max: 10)',
                  default: 5,
                  maximum: 10,
                  minimum: 1
                }
              },
              required: ['collection']
            }
          },
          {
            name: 'explain',
            description: 'Get the execution plan for an aggregation pipeline',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to analyze'
                },
                pipeline: {
                  type: 'array',
                  items: { type: 'object' },
                  description: 'MongoDB aggregation pipeline stages to analyze'
                }
              },
              required: ['collection', 'pipeline']
            }
          }
        ]
      };
    }
    
    // Handle tool calls
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      console.error(`Executing tool: ${name}`);
      console.error(`Arguments:`, JSON.stringify(args, null, 2));
      
      // Connect to MongoDB
      const client = await getMongoClient();
      
      // Handle aggregate tool
      if (name === 'aggregate') {
        const { collection, pipeline } = args;
        
        // Select database
        const db = client.db(DEFAULT_DATABASE);
        
        console.error(`Running aggregation on collection: ${collection}`);
        console.error(`Pipeline: ${JSON.stringify(pipeline)}`);
        
        const results = await db.collection(collection).aggregate(pipeline).toArray();
        console.error(`Results count: ${results.length}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }
      
      // Handle sample tool
      if (name === 'sample') {
        const { collection, count = 5 } = args;
        const sampleCount = Math.min(count || 5, 10);
        
        // Select database
        const db = client.db(DEFAULT_DATABASE);
        
        console.error(`Sampling ${sampleCount} documents from collection: ${collection}`);
        
        const results = await db.collection(collection).aggregate([
          { $sample: { size: sampleCount } }
        ]).toArray();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      }
      
      // Handle explain tool
      if (name === 'explain') {
        const { collection, pipeline } = args;
        
        // Select database
        const db = client.db(DEFAULT_DATABASE);
        
        console.error(`Explaining query plan for collection: ${collection}`);
        
        const explainResults = await db.collection(collection).explain().aggregate(pipeline).toArray();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(explainResults, null, 2)
            }
          ]
        };
      }
      
      // Unknown tool
      return {
        error: {
          code: -32601,
          message: `Tool not found: ${name}`
        }
      };
    }
    
    // For resources
    if (method === 'resources/list') {
      return {
        resources: [
          {
            uri: `mongodb://${DEFAULT_DATABASE}/PEMLeads`,
            mimeType: 'application/json',
            name: 'PEMLeads Collection',
            description: 'Leads collection in GondiCustomerDb database'
          }
        ]
      };
    }
    
    // Method not found
    return {
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    };
  } catch (error) {
    console.error('Error in request handler:', error);
    return {
      error: {
        code: -32603,
        message: 'Internal server error',
        data: { details: error.message }
      }
    };
  }
};

// Connect to stdio transport
const transport = new StdioServerTransport();
server.connect(transport)
  .then(() => console.error('Server running and connected'))
  .catch(error => {
    console.error('Server failed to start:', error);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});
