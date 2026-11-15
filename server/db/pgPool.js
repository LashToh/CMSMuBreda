import pg from 'pg';
import { config } from '../config/index.js';

/**
 * PostgreSQL pool for the OpenMU (Season 6) backend: MU_BACKEND=openmu.
 * Uses the same DB_HOST / DB_PORT / DB_USER / DB_PASSWORD as the SQL Server backend;
 * DB_DATABASE defaults to "openmu" for this backend.
 */
let pool = null;

export function getPgPool() {
  if (config.isMock) {
    throw new Error('Database pool requested while MU_DATABASE_MODE=mock');
  }
  if (pool) return pool;
  pool = new pg.Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', (err) => console.error('[pg]', err.message));
  return pool;
}

export async function pgQuery(text, params = []) {
  const result = await getPgPool().query(text, params);
  return result.rows;
}
