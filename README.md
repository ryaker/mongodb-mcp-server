# MongoDB MCP Server

A Model Context Protocol (MCP) server that provides Claude with the ability to interact with MongoDB databases. This implementation allows Claude to perform a wide range of MongoDB operations, including querying, aggregation, data manipulation (CRUD), and database management directly from the conversation.

## Overview

This MongoDB MCP server implements the Model Context Protocol to create a bridge between Claude and MongoDB databases. It enables Claude to execute MongoDB commands through a standardized interface, making it possible to analyze, manage, and work with your data directly in conversations.

## Features

- **Comprehensive MongoDB Operations**: Query documents (`find`, `findOne`), perform aggregations (`aggregate`), count documents (`count`), get distinct values (`distinct`), and sample data (`sample`).
- **Data Manipulation**: Insert (`insertOne`, `insertMany`), update (`updateOne`, `updateMany`), and delete (`deleteOne`, `deleteMany`) documents.
- **Database Management**: List databases (`listDatabases`), list collections (`listCollections`), and drop collections (`dropCollection`).
- **Query Analysis**: Get execution plans for aggregation pipelines (`explain`).
- **Flexible Database Selection**: Specify the target database for each operation (defaults to `DEFAULT_DATABASE`).
- **Secure Connection**: Connects to MongoDB using environment variables for credentials.
- **Simple Integration**: Works with Claude Desktop or Cursor through the MCP system.

## Installation

### Prerequisites

- Node.js (v14 or newer recommended)
- Access to a MongoDB instance (local or Atlas)
- Claude Desktop or Cursor application

### Setup

1.  Clone this repository (replace `ryaker` with your username if forked):
    ```bash
    git clone git@github.com-personal:ryaker/mongodb-mcp-server.git
    # Or use HTTPS if preferred
    # git clone https://github.com/ryaker/mongodb-mcp-server.git
    cd mongodb-mcp-server
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Claude Desktop or Cursor:
    *   Find your MCP configuration settings. In Cursor, this is typically in `Settings` > `Extensions` > `Model Context Protocol`. In Claude Desktop, it might be in a `config.json` file.
    *   Add an entry for this server, ensuring you provide the correct absolute path to the `mongo-mcp-server.js` file and set the required environment variables.

    **Example Configuration (adjust path as needed):**
    ```json
    {
      "mcpServers": {
        "mongo-custom-server": { // You can name this key anything descriptive
          "command": "node",
          "args": ["/Volumes/Dev/localDev/MCPServers/CustomMongo_clean/mongo-mcp-server.js"], // <-- Make sure this path is correct!
          "env": {
            "MONGODB_URI": "mongodb+srv://your_username:your_password@your_cluster.mongodb.net/?retryWrites=true&w=majority", // <-- Your MongoDB connection string
            "DEFAULT_DATABASE": "YourDefaultDbName" // <-- Optional: Set a default database
          }
        }
      }
    }
    ```

    *   **Important:** Replace the placeholder `MONGODB_URI` with your actual MongoDB connection string. Ensure the user specified in the URI has the necessary permissions for the operations you intend to perform.
    *   The `DEFAULT_DATABASE` is optional. If set, operations will target this database unless overridden by the `database` parameter in a tool call.

4.  Restart Claude Desktop or Cursor to load the new MCP server.

## Tool Reference

The server exposes the following tools. Most tools accept an optional `database` parameter to specify the target database, otherwise they use the `DEFAULT_DATABASE` set in the environment variables.

**Querying & Reading**

1.  **`aggregate`**: Run a MongoDB aggregation pipeline.
    *   `collection` (string, required): Name of the collection.
    *   `pipeline` (array, required): Aggregation pipeline stages.
    *   `database` (string, optional): Target database.
2.  **`sample`**: Get random sample documents.
    *   `collection` (string, required): Name of the collection.
    *   `count` (number, optional, default: 5, max: 10): Number of documents to sample.
    *   `database` (string, optional): Target database.
3.  **`explain`**: Get the execution plan for an aggregation pipeline.
    *   `collection` (string, required): Name of the collection.
    *   `pipeline` (array, required): Aggregation pipeline stages.
    *   `database` (string, optional): Target database.
4.  **`find`**: Find documents matching a query.
    *   `collection` (string, required): Name of the collection.
    *   `filter` (object, optional, default: {}): Query filter.
    *   `projection` (object, optional, default: {}): Fields to include/exclude.
    *   `limit` (number, optional, default: 10, max: 100): Max documents to return.
    *   `sort` (object, optional, default: {}): Sort criteria.
    *   `database` (string, optional): Target database.
5.  **`findOne`**: Find a single document matching a query.
    *   `collection` (string, required): Name of the collection.
    *   `filter` (object, required): Query filter.
    *   `projection` (object, optional, default: {}): Fields to include/exclude.
    *   `database` (string, optional): Target database.
6.  **`count`**: Count documents matching a query.
    *   `collection` (string, required): Name of the collection.
    *   `filter` (object, optional, default: {}): Query filter.
    *   `database` (string, optional): Target database.
7.  **`distinct`**: Get distinct values for a field.
    *   `collection` (string, required): Name of the collection.
    *   `field` (string, required): Field name.
    *   `filter` (object, optional, default: {}): Query filter.
    *   `database` (string, optional): Target database.

**Data Manipulation (Write/Delete)**

8.  **`insertOne`**: Insert a single document.
    *   `collection` (string, required): Name of the collection.
    *   `document` (object, required): Document to insert.
    *   `database` (string, optional): Target database.
9.  **`insertMany`**: Insert multiple documents.
    *   `collection` (string, required): Name of the collection.
    *   `documents` (array, required): Array of documents.
    *   `database` (string, optional): Target database.
10. **`updateOne`**: Update a single document.
    *   `collection` (string, required): Name of the collection.
    *   `filter` (object, required): Filter to select document.
    *   `update` (object, required): Update operations (e.g., `$set`).
    *   `upsert` (boolean, optional, default: false): Create if not found?
    *   `database` (string, optional): Target database.
11. **`updateMany`**: Update multiple documents.
    *   `collection` (string, required): Name of the collection.
    *   `filter` (object, required): Filter to select documents.
    *   `update` (object, required): Update operations.
    *   `database` (string, optional): Target database.
12. **`deleteOne`**: Delete a single document.
    *   `collection` (string, required): Name of the collection.
    *   `filter` (object, required): Filter to select document.
    *   `database` (string, optional): Target database.
13. **`deleteMany`**: Delete multiple documents.
    *   `collection` (string, required): Name of the collection.
    *   `filter` (object, required): Filter to select documents.
    *   `database` (string, optional): Target database.

**Database/Collection Management**

14. **`listCollections`**: List all collections in a database.
    *   `nameOnly` (boolean, optional, default: false): Return only names?
    *   `database` (string, optional): Target database.
15. **`listDatabases`**: List all databases on the server.
    *   `nameOnly` (boolean, optional, default: true): Return only names?
16. **`dropCollection`**: Drop an entire collection.
    *   `collection` (string, required): Name of the collection to drop.
    *   `confirm` (boolean, required): Must be `true` to confirm deletion.
    *   `database` (string, optional): Target database.

## Usage Examples

**Querying Data:**

```
User: Find the 5 most recent user documents in the 'users' collection.
Claude: (Calls 'find' with collection='users', limit=5, sort={createdAt: -1})

User: Show me the user document with email 'test@example.com'.
Claude: (Calls 'findOne' with collection='users', filter={email: 'test@example.com'})

User: How many orders were placed yesterday in the 'orders' collection in the 'sales' database?
Claude: (Calls 'count' with collection='orders', filter={orderDate: {$gte: startOfDay, $lt: endOfDay}}, database='sales')
```

**Aggregating Data:**

```
User: What are the distinct product categories in the 'products' collection?
Claude: (Calls 'distinct' with collection='products', field='category')

User: Show me the total sales per month from the 'orders' collection.
Claude: (Calls 'aggregate' with collection='orders', pipeline=[...])
```

**Modifying Data:**

```
User: Insert a new user document: { name: 'Alice', email: 'alice@example.com' }
Claude: (Calls 'insertOne' with collection='users', document={ name: 'Alice', email: 'alice@example.com' })

User: Update the user with email 'alice@example.com' to set their status to 'active'.
Claude: (Calls 'updateOne' with collection='users', filter={email: 'alice@example.com'}, update={$set: {status: 'active'}})

User: Delete all log entries older than 30 days from the 'logs' collection.
Claude: (Calls 'deleteMany' with collection='logs', filter={timestamp: {$lt: thirtyDaysAgo}})
```

**Managing Collections:**

```
User: List all collections in the 'staging' database.
Claude: (Calls 'listCollections' with database='staging')

User: Please drop the 'test_data' collection. Confirm deletion.
Claude: (Calls 'dropCollection' with collection='test_data', confirm=true)
```

## Security Considerations

- **NEVER hardcode database credentials** in the server file or commit them to version control.
- Always use environment variables (`MONGODB_URI`) for connection strings.
- Create a dedicated MongoDB user for this MCP server with the principle of least privilege. Grant only the permissions necessary for the intended operations.
- Consider using IP Access Lists (whitelisting) in MongoDB Atlas for an additional layer of security.

## Troubleshooting

- **Connection Issues**: Verify `MONGODB_URI` is correct. Ensure the MongoDB user has permissions and network access (firewalls, IP lists). Check server logs (`console.error`) via Claude Desktop/Cursor logs.
- **Tool Not Found/Working**: Ensure the server is running and configured correctly in Claude Desktop/Cursor. Check the MCP server path is correct. Restart Claude/Cursor.
- **Permissions Errors**: Review the MongoDB user's roles and permissions.

## License

[MIT License](LICENSE)

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MongoDB Node.js Driver](https://github.com/mongodb/node-mongodb-native)
