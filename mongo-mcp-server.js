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
        'explain': {},
        'find': {},
        'findOne': {},
        'count': {},
        'listCollections': {},
        'distinct': {},
        'listDatabases': {},
        'insertOne': {},
        'insertMany': {},
        'updateOne': {},
        'updateMany': {},
        'deleteOne': {},
        'deleteMany': {},
        'dropCollection': {}
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
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
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
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
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
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'pipeline']
            }
          },
          {
            name: 'find',
            description: 'Find documents matching a query',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to query'
                },
                filter: {
                  type: 'object',
                  description: 'MongoDB query filter (default: empty object to match all)',
                  default: {}
                },
                projection: {
                  type: 'object',
                  description: 'Fields to include or exclude in the result',
                  default: {}
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of documents to return (default: 10, max: 100)',
                  default: 10,
                  maximum: 100,
                  minimum: 1
                },
                sort: {
                  type: 'object',
                  description: 'Sort criteria (e.g., { field: 1 } for ascending, { field: -1 } for descending)',
                  default: {}
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection']
            }
          },
          {
            name: 'findOne',
            description: 'Find a single document matching a query',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to query'
                },
                filter: {
                  type: 'object',
                  description: 'MongoDB query filter'
                },
                projection: {
                  type: 'object',
                  description: 'Fields to include or exclude in the result',
                  default: {}
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'filter']
            }
          },
          {
            name: 'count',
            description: 'Count documents matching a query',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to query'
                },
                filter: {
                  type: 'object',
                  description: 'MongoDB query filter (default: empty object to count all)',
                  default: {}
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection']
            }
          },
          {
            name: 'listCollections',
            description: 'List all collections in the database',
            inputSchema: {
              type: 'object',
              properties: {
                nameOnly: {
                  type: 'boolean',
                  description: 'If true, return only collection names (default: false)',
                  default: false
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: []
            }
          },
          {
            name: 'distinct',
            description: 'Get distinct values for a field in a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to query'
                },
                field: {
                  type: 'string',
                  description: 'Field name to get distinct values for'
                },
                filter: {
                  type: 'object',
                  description: 'MongoDB query filter (default: empty object)',
                  default: {}
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'field']
            }
          },
          {
            name: 'listDatabases',
            description: 'List all databases on the MongoDB server',
            inputSchema: {
              type: 'object',
              properties: {
                nameOnly: {
                  type: 'boolean',
                  description: 'If true, return only database names (default: true)',
                  default: true
                }
              },
              required: []
            }
          },
          {
            name: 'insertOne',
            description: 'Insert a single document into a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to insert into'
                },
                document: {
                  type: 'object',
                  description: 'Document to insert'
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'document']
            }
          },
          {
            name: 'insertMany',
            description: 'Insert multiple documents into a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to insert into'
                },
                documents: {
                  type: 'array',
                  items: { type: 'object' },
                  description: 'Array of documents to insert'
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'documents']
            }
          },
          {
            name: 'updateOne',
            description: 'Update a single document in a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to update'
                },
                filter: {
                  type: 'object',
                  description: 'Filter to select the document to update'
                },
                update: {
                  type: 'object',
                  description: 'Update operations to perform (e.g., { $set: { field: value } })'
                },
                upsert: {
                  type: 'boolean',
                  description: 'If true, creates a new document when no document matches (default: false)',
                  default: false
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'filter', 'update']
            }
          },
          {
            name: 'updateMany',
            description: 'Update multiple documents in a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to update'
                },
                filter: {
                  type: 'object',
                  description: 'Filter to select the documents to update'
                },
                update: {
                  type: 'object',
                  description: 'Update operations to perform (e.g., { $set: { field: value } })'
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'filter', 'update']
            }
          },
          {
            name: 'deleteOne',
            description: 'Delete a single document from a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to delete from'
                },
                filter: {
                  type: 'object',
                  description: 'Filter to select the document to delete'
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'filter']
            }
          },
          {
            name: 'deleteMany',
            description: 'Delete multiple documents from a collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to delete from'
                },
                filter: {
                  type: 'object',
                  description: 'Filter to select the documents to delete'
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                }
              },
              required: ['collection', 'filter']
            }
          },
          {
            name: 'dropCollection',
            description: 'Drop an entire collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Name of the collection to drop'
                },
                database: {
                  type: 'string',
                  description: 'Database name (defaults to DEFAULT_DATABASE)'
                },
                confirm: {
                  type: 'boolean',
                  description: 'Set to true to confirm this destructive operation',
                  default: false
                }
              },
              required: ['collection', 'confirm']
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
      // Select database
      const db = client.db(DEFAULT_DATABASE);
      
      // Handle aggregate tool
      if (name === 'aggregate') {
        const { collection, pipeline, database = DEFAULT_DATABASE } = args;
        
        console.error(`Running aggregation on collection: ${collection} in database: ${database}`);
        console.error(`Pipeline: ${JSON.stringify(pipeline)}`);
        
        const db = client.db(database);
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
        const { collection, count = 5, database = DEFAULT_DATABASE } = args;
        const sampleCount = Math.min(count || 5, 10);
        
        console.error(`Sampling ${sampleCount} documents from collection: ${collection} in database: ${database}`);
        
        const db = client.db(database);
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
        const { collection, pipeline, database = DEFAULT_DATABASE } = args;
        
        console.error(`Explaining query plan for collection: ${collection} in database: ${database}`);
        
        const db = client.db(database);
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
      
      // Handle find tool
      if (name === 'find') {
        const { collection, filter = {}, projection = {}, limit = 10, sort = {}, database = DEFAULT_DATABASE } = args;
        const actualLimit = Math.min(limit || 10, 100);
        
        console.error(`Finding documents in collection: ${collection} in database: ${database}`);
        console.error(`Filter: ${JSON.stringify(filter)}`);
        
        const db = client.db(database);
        const cursor = db.collection(collection).find(filter, { projection });
        
        // Apply sort if provided
        if (Object.keys(sort).length > 0) {
          cursor.sort(sort);
        }
        
        // Apply limit
        cursor.limit(actualLimit);
        
        const results = await cursor.toArray();
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
      
      // Handle findOne tool
      if (name === 'findOne') {
        const { collection, filter, projection = {}, database = DEFAULT_DATABASE } = args;
        
        console.error(`Finding one document in collection: ${collection} in database: ${database}`);
        console.error(`Filter: ${JSON.stringify(filter)}`);
        
        const db = client.db(database);
        const result = await db.collection(collection).findOne(filter, { projection });
        
        return {
          content: [
            {
              type: 'text',
              text: result ? JSON.stringify(result, null, 2) : 'No document found matching the criteria'
            }
          ]
        };
      }
      
      // Handle count tool
      if (name === 'count') {
        const { collection, filter = {}, database = DEFAULT_DATABASE } = args;
        
        console.error(`Counting documents in collection: ${collection} in database: ${database}`);
        console.error(`Filter: ${JSON.stringify(filter)}`);
        
        const db = client.db(database);
        const count = await db.collection(collection).countDocuments(filter);
        
        return {
          content: [
            {
              type: 'text',
              text: `${count}`
            }
          ]
        };
      }
      
      // Handle listCollections tool
      if (name === 'listCollections') {
        const { nameOnly = false, database = DEFAULT_DATABASE } = args;
        
        console.error(`Listing collections in database: ${database}`);
        
        const db = client.db(database);
        const collections = await db.listCollections().toArray();
        
        if (nameOnly) {
          const collectionNames = collections.map(col => col.name);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(collectionNames, null, 2)
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(collections, null, 2)
              }
            ]
          };
        }
      }
      
      // Handle distinct tool
      if (name === 'distinct') {
        const { collection, field, filter = {}, database = DEFAULT_DATABASE } = args;
        
        console.error(`Getting distinct values for ${field} in collection: ${collection} in database: ${database}`);
        console.error(`Filter: ${JSON.stringify(filter)}`);
        
        const db = client.db(database);
        const values = await db.collection(collection).distinct(field, filter);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(values, null, 2)
            }
          ]
        };
      }
      
      // Handle listDatabases tool
      if (name === 'listDatabases') {
        const { nameOnly = true } = args;
        
        console.error('Listing all databases');
        
        const adminDb = client.db('admin');
        const databasesList = await adminDb.admin().listDatabases();
        
        if (nameOnly) {
          const dbNames = databasesList.databases.map(db => db.name);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(dbNames, null, 2)
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(databasesList, null, 2)
              }
            ]
          };
        }
      }
      
      // Handle insertOne tool
      if (name === 'insertOne') {
        const { collection, document, database = DEFAULT_DATABASE } = args;
        
        console.error(`Inserting one document into collection: ${collection} in database: ${database}`);
        
        const db = client.db(database);
        const result = await db.collection(collection).insertOne(document);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      // Handle insertMany tool
      if (name === 'insertMany') {
        const { collection, documents, database = DEFAULT_DATABASE } = args;
        
        console.error(`Inserting ${documents.length} documents into collection: ${collection} in database: ${database}`);
        
        const db = client.db(database);
        const result = await db.collection(collection).insertMany(documents);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      // Handle updateOne tool
      if (name === 'updateOne') {
        const { collection, filter, update, upsert = false, database = DEFAULT_DATABASE } = args;
        
        console.error(`Updating one document in collection: ${collection} in database: ${database}`);
        console.error(`Filter: ${JSON.stringify(filter)}`);
        console.error(`Update: ${JSON.stringify(update)}`);
        
        const db = client.db(database);
        const result = await db.collection(collection).updateOne(filter, update, { upsert });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      // Handle updateMany tool
      if (name === 'updateMany') {
        const { collection, filter, update, database = DEFAULT_DATABASE } = args;
        
        console.error(`Updating multiple documents in collection: ${collection} in database: ${database}`);
        console.error(`Filter: ${JSON.stringify(filter)}`);
        console.error(`Update: ${JSON.stringify(update)}`);
        
        const db = client.db(database);
        const result = await db.collection(collection).updateMany(filter, update);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      // Handle deleteOne tool
      if (name === 'deleteOne') {
        const { collection, filter, database = DEFAULT_DATABASE } = args;
        
        console.error(`Deleting one document from collection: ${collection} in database: ${database}`);
        console.error(`Filter: ${JSON.stringify(filter)}`);
        
        const db = client.db(database);
        const result = await db.collection(collection).deleteOne(filter);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      // Handle deleteMany tool
      if (name === 'deleteMany') {
        const { collection, filter, database = DEFAULT_DATABASE } = args;
        
        console.error(`Deleting multiple documents from collection: ${collection} in database: ${database}`);
        console.error(`Filter: ${JSON.stringify(filter)}`);
        
        const db = client.db(database);
        const result = await db.collection(collection).deleteMany(filter);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
      
      // Handle dropCollection tool
      if (name === 'dropCollection') {
        const { collection, database = DEFAULT_DATABASE, confirm } = args;
        
        if (!confirm) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: You must set confirm=true to perform this destructive operation'
              }
            ]
          };
        }
        
        console.error(`Dropping collection: ${collection} in database: ${database}`);
        
        const db = client.db(database);
        const result = await db.dropCollection(collection);
        
        return {
          content: [
            {
              type: 'text',
              text: result ? 'Collection dropped successfully' : 'Failed to drop collection'
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
