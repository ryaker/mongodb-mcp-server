# MongoDB MCP Server

A Model Context Protocol (MCP) server that provides Claude with the ability to interact with MongoDB databases. This implementation allows Claude to perform aggregations, sample data, and analyze query plans directly from MongoDB collections.

## Overview

This MongoDB MCP server implements the Model Context Protocol to create a bridge between Claude and MongoDB databases. It enables Claude to execute MongoDB queries and aggregations through a standardized interface, making it possible to analyze and work with your data directly in conversations.

## Features

- **MongoDB Aggregation Pipeline Execution**: Run complex aggregation pipelines on MongoDB collections
- **Random Sampling**: Retrieve random document samples from collections
- **Query Plan Analysis**: Get execution plans for aggregation pipelines to understand performance
- **Secure Connection**: Connects to MongoDB Atlas using environment variables for credentials
- **Simple Integration**: Works with Claude Desktop through the MCP system

## Tools

The server exposes three primary tools:

1. **aggregate** - Executes MongoDB aggregation pipelines on specified collections
2. **sample** - Returns random document samples from a collection
3. **explain** - Provides execution plans for aggregation pipelines

## Installation

### Prerequisites

- Node.js (v14 or newer)
- MongoDB Atlas account or MongoDB server
- Claude Desktop application

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/mongodb-mcp-server.git
   cd mongodb-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Claude Desktop:
   - Update your Claude Desktop configuration file to include the MCP server with environment variables:

   ```json
   "mcpServers": {
     "mongo-simple-server": {
       "command": "node",
       "args": ["/path/to/mongo-mcp-server.js"],
       "env": {
         "MONGODB_URI": "mongodb+srv://username:password@host",
         "DEFAULT_DATABASE": "YourDatabaseName"
       }
     }
   }
   ```

4. Restart Claude Desktop to apply the changes

## Usage Examples

### Sampling Documents

Ask Claude to sample documents from a collection:

```
Can you show me 5 random documents from the PEMLeads collection?
```

Claude will use the `sample` tool to retrieve random documents.

### Running Aggregations

Ask Claude to run an aggregation pipeline:

```
Can you aggregate the PEMLeads collection to count leads by state?
```

Claude can construct and execute an aggregation pipeline like:

```json
[
  { "$group": { "_id": "$state", "count": { "$sum": 1 } } },
  { "$sort": { "count": -1 } }
]
```

### Analyzing Query Performance

Ask Claude to analyze a query plan:

```
Can you explain the performance of an aggregation that finds leads with high value?
```

Claude can use the `explain` tool to analyze the execution plan of a pipeline.

## Configuration

### MongoDB Connection

The server connects to MongoDB using environment variables:

- `MONGODB_URI`: The full MongoDB connection string (required)
- `DEFAULT_DATABASE`: The default database to use (optional, defaults to "GondiCustomerDb")

### Security Considerations

- **NEVER hardcode database credentials** in the server file
- Always use environment variables for connection strings
- Create a MongoDB user with only the necessary permissions for your use case
- Consider using IP whitelisting in MongoDB Atlas for additional security

## Extending the Server

### Adding New Tools

To add new MongoDB functionality:

1. Add the tool to the capabilities object in the server initialization
2. Add the tool definition to the `tools/list` response
3. Implement the tool's functionality in the `tools/call` handler

### Supporting Additional Databases

The current implementation uses the database specified in the `DEFAULT_DATABASE` environment variable. You can extend this to:

1. Add database selection to each tool's input schema
2. Implement multi-database support in the tool handlers

## Troubleshooting

### Connection Issues

If the server fails to connect to MongoDB:
- Verify the connection string is correct
- Ensure the MongoDB user has appropriate permissions
- Check network connectivity to the MongoDB server

### Claude Integration Problems

If Claude can't find or use the tools:
- Verify Claude Desktop configuration is correct
- Restart Claude Desktop after making changes
- Check Claude Desktop logs for errors

### Debugging

The server includes extensive console logging for debugging. Check the Claude Desktop logs for messages from the MongoDB MCP server.

## License

[MIT License](LICENSE)

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the framework
- [MongoDB Node.js Driver](https://github.com/mongodb/node-mongodb-native) for MongoDB connectivity
