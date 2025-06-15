#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { executeQuery } from './tools/query.js';

const TOOL_DEFINITIONS = [
  {
    name: 'execute_query',
    description: 'Execute SQL queries on PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute'
        },
        readOnly: {
          type: 'boolean',
          description: 'If true, only allows read-only queries (SELECT, EXPLAIN, etc.)',
          default: false
        }
      },
      required: ['query']
    }
  }
];

class PostgreSQLServer {
  private server: Server;
  private connectionString: string;
  private serverMode: 'readonly' | 'write';

  constructor(connectionString: string, mode: 'readonly' | 'write' = 'write') {
    this.connectionString = connectionString;
    this.serverMode = mode;
    
    this.server = new Server(
      {
        name: 'simple-postgresql-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {
            execute_query: TOOL_DEFINITIONS[0]
          },
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
    
    console.error(`PostgreSQL MCP server running in ${this.serverMode.toUpperCase()} mode`);
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'execute_query': {
            const { query, readOnly = false } = request.params.arguments as {
              query: string;
              readOnly?: boolean;
            };
            
            // Enforce readonly mode if server is in readonly mode
            const enforceReadOnly = this.serverMode === 'readonly' || readOnly;
            
            const result = await executeQuery(this.connectionString, query, enforceReadOnly);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Simple PostgreSQL MCP server running on stdio');
  }
}

// Get connection string from command line arguments
const connectionString = process.argv[2];

if (!connectionString) {
  console.error('Error: PostgreSQL connection string is required as first argument');
  console.error('Usage: node index.js "postgresql://user:password@localhost:5432/dbname" [readonly|write]');
  process.exit(1);
}

// Get mode from command line arguments (default to 'write' if not provided)
const mode = process.argv[3]?.toLowerCase() === 'readonly' ? 'readonly' : 'write';

const server = new PostgreSQLServer(connectionString, mode);
server.run().catch(console.error);
