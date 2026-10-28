import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;

function getDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1];
        return match[1];
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function getDbPool(): Pool | null {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 15000,
    });

    pool.on('error', (err) => {
      console.warn('Supabase DB pool idle client warning:', err.message);
    });
  }

  return pool;
}

export async function queryDb<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const p = getDbPool();
  if (!p) {
    throw new Error('DATABASE_URL is not configured');
  }
  try {
    const result = await p.query(text, params);
    return result.rows as T[];
  } catch (err: any) {
    // If pool connection was stale, retry once with fresh connection
    if (err.message && (err.message.includes('Connection terminated') || err.message.includes('timeout'))) {
      const retryResult = await p.query(text, params);
      return retryResult.rows as T[];
    }
    throw err;
  }
}
