import { DatabaseConnection } from '../utils/connection.js';

interface QueryResult {
  success: boolean;
  rowCount: number;
  rows: any[];
  command: string;
  executionTime: number;
}

/**
 * Check if a SQL query is read-only
 * @param query SQL query string
 * @returns boolean indicating if query is read-only
 */
function isReadOnlyQuery(query: string): boolean {
  // Normalize query - trim whitespace and convert to uppercase for comparison
  const normalizedQuery = query.trim().toUpperCase();
  
  // Check if query starts with SELECT, EXPLAIN, SHOW, etc.
  const readOnlyCommands = [
    'SELECT', 
    'EXPLAIN', 
    'SHOW',
    'WITH', // CTE that ends with SELECT
    'ANALYZE',
    'DESCRIBE'
  ];
  
  return readOnlyCommands.some(cmd => normalizedQuery.startsWith(cmd)) &&
    !normalizedQuery.includes('INTO') && // Exclude SELECT INTO
    !normalizedQuery.includes('FOR UPDATE') && // Exclude locking queries
    !normalizedQuery.includes('FOR SHARE');
}

export async function executeQuery(
  connectionString: string,
  query: string,
  readOnly: boolean = false
): Promise<QueryResult> {
  const db = DatabaseConnection.getInstance();
  const startTime = Date.now();
  
  try {
    // Check if query is allowed in readOnly mode
    if (readOnly && !isReadOnlyQuery(query)) {
      throw new Error('Only read-only queries are allowed when readOnly is set to true');
    }
    
    await db.connect(connectionString);
    
    // Execute the query
    const result = await db.query(query);
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      rowCount: result.rowCount || 0,
      rows: result.rows || [],
      command: result.command || 'UNKNOWN',
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    throw new Error(`Query execution failed: ${error instanceof Error ? error.message : String(error)} (execution time: ${executionTime}ms)`);
  } finally {
    await db.disconnect();
  }
}