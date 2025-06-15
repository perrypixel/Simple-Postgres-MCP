# Simple PostgreSQL MCP Server

A minimal Model Context Protocol (MCP) server for executing SQL queries on PostgreSQL databases with configurable permissions.

## Features

- Execute SQL queries with optional read-only or write access
- Server-level mode (read-only/write) configurable via command line
- Returns structured results with metadata
- Simple setup using a PostgreSQL connection string

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/perrypixel/Simple-Postgres-MCP
   cd Simple-Postgres-MCP
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Build the project**
   ```bash
   npm run build
   ```

## MCP Configuration

Add the following to your MCP client configuration (`mcp.json`):

### Write Mode (default)

```json
{
  "mcpServers": {
    "simple-postgresql-mcp": {
      "command": "node",
      "args": [
        "/path/to/build/index.js",
        "postgresql://username:password@localhost:5432/database_name",
        "write"
      ]
    }
  }
}
```

### Read-Only Mode

```json
{
  "mcpServers": {
    "simple-postgresql-mcp": {
      "command": "node",
      "args": [
        "/path/to/build/index.js",
        "postgresql://username:password@localhost:5432/database_name",
        "readonly"
      ]
    }
  }
}
```

> **Note:** Update the path in the configuration to point to the `index.js` file inside your `build` folder.

## Usage

1. Copy the appropriate MCP configuration (read-only or write mode) to your tool’s `mcp.json` (e.g., Cursor, Windsurf, Copilot, etc.).
2. Start your MCP client. The server is now ready to use!

## Support
If you find this tool helpful, you can support the development by:
- Buying me a coffee at https://ko-fi.com/perrypixel
- UPI to kevinp@apl
