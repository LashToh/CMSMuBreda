/**
 * Run ON the VPS from /var/www/CMSMuBreda:
 *   node scripts/check-event-rankings.js
 * Uses the same .env / config as the API.
 */
import 'dotenv/config';
import sql from 'mssql';

const cfg = {
  server: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: String(process.env.DB_ENCRYPT || 'false') === 'true',
    trustServerCertificate: String(process.env.DB_TRUST_CERT || 'true') !== 'false',
    enableArithAbort: true,
  },
};

console.log('Connecting:', {
  host: cfg.server,
  port: cfg.port,
  database: cfg.database,
  user: cfg.user,
  rankingEnv: process.env.DB_DATABASE_RANKING || '(empty)',
});

const pool = await sql.connect(cfg);
try {
  const db = await pool.request().query('SELECT DB_NAME() AS db, @@SERVERNAME AS server');
  console.log('Connected to:', db.recordset[0]);

  for (const table of [
    'RankingDevilSquare',
    'RankingBloodCastle',
    'RankingChaosCastle',
    'RankingIllusionTemple',
    'RankingCastleSiege',
    'RankingDuel',
  ]) {
    try {
      const r = await pool.request().query(
        `SELECT COUNT(*) AS n FROM [${table}];
         SELECT TOP 3 * FROM [${table}] ORDER BY 2 DESC;`,
      );
      // mssql returns multiple recordsets
      const sets = r.recordsets || [r.recordset];
      console.log(`\n${table}: count=${sets[0]?.[0]?.n ?? '?'}`);
      console.log(' top:', sets[1] || sets[0]);
    } catch (err) {
      console.log(`\n${table}: ERROR`, err.message);
    }
  }
} finally {
  await pool.close();
}
