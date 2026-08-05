import sql from 'mssql';
import { config } from '../config/index.js';

let pool = null;
let pool2 = null;

function buildConfig(database) {
  return {
    server: config.db.host,
    port: config.db.port,
    database,
    user: config.db.user,
    password: config.db.password,
    options: {
      encrypt: config.db.encrypt,
      trustServerCertificate: config.db.trustServerCertificate,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

export async function getPool() {
  if (config.isMock) {
    throw new Error('Database pool requested while MU_DATABASE_MODE=mock');
  }
  if (pool) return pool;
  pool = await sql.connect(buildConfig(config.db.database));
  return pool;
}

export async function getAccountsPool() {
  if (config.isMock) {
    throw new Error('Database pool requested while MU_DATABASE_MODE=mock');
  }
  const db2 = config.db.database2;
  if (!db2 || db2 === config.db.database) {
    return getPool();
  }
  if (pool2) return pool2;
  pool2 = new sql.ConnectionPool(buildConfig(db2));
  await pool2.connect();
  return pool2;
}

export async function closePools() {
  if (pool) {
    await pool.close();
    pool = null;
  }
  if (pool2) {
    await pool2.close();
    pool2 = null;
  }
}

export async function withTransaction(fn, { accountsDb = false } = {}) {
  const p = accountsDb ? await getAccountsPool() : await getPool();
  const transaction = new sql.Transaction(p);
  await transaction.begin();
  try {
    const request = () => new sql.Request(transaction);
    const result = await fn({ transaction, request, sql });
    await transaction.commit();
    return result;
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      /* ignore rollback errors */
    }
    throw err;
  }
}

export { sql };
