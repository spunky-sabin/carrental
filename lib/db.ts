import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment variables.');
}

// HTTP-based SQL client — no WebSocket or 'ws' package needed
const sql = connectionString ? neon(connectionString) : null;

type SqlValue = string | number | boolean | Date | null;
type QueryRow = Record<string, unknown>;

/**
 * Run a parameterized query using sql.query().
 * Returns { rows, rowCount } to match the pg/Pool result shape used by callers.
 *
 * Note: sql.query() returns the rows array directly (not a {rows} wrapper).
 */
export async function query<T = QueryRow>(text: string, params?: SqlValue[]) {
  if (!sql) {
    console.error('Database connection not available. DATABASE_URL is not set.');
    return { rows: [], rowCount: 0 };
  }
  const rows = (await sql.query(text, params ?? [])) as T[];
  return { rows, rowCount: rows.length };
}
