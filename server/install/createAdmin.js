import crypto from 'node:crypto';
import sql from 'mssql';

export function hashPasswordForInstall(method, password, username, sha256Salt = '') {
  switch (String(method || 'md5').toLowerCase()) {
    case 'plain':
      return password;
    case 'wz_md5':
      return password;
    case 'sha256':
      return crypto
        .createHash('sha256')
        .update(`${password}${username}${sha256Salt}`, 'utf8')
        .digest('hex');
    case 'md5':
    default:
      return crypto.createHash('md5').update(password, 'utf8').digest('hex');
  }
}

/**
 * Create MEMB_INFO admin account using the install form DB credentials
 * (before the main app reloads .env).
 */
export async function createAdminAccountSql({
  dbHost,
  dbPort,
  dbDatabase,
  dbUser,
  dbPassword,
  username,
  password,
  email,
  hashMethod = 'md5',
  snoNumb = '1111111111111',
}) {
  const pool = await sql.connect({
    server: dbHost,
    port: Number(dbPort) || 1433,
    database: dbDatabase,
    user: dbUser,
    password: dbPassword,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    connectionTimeout: 10000,
    requestTimeout: 10000,
  });

  try {
    const existing = await pool
      .request()
      .input('username', sql.VarChar(10), username)
      .query('SELECT TOP 1 memb___id FROM MEMB_INFO WHERE memb___id = @username');

    if (existing.recordset.length > 0) {
      // Promote existing account to admin via ADMIN_USERNAMES only
      return { created: false, existed: true, username };
    }

    const passwordHash = hashPasswordForInstall(hashMethod, password, username);
    const method = String(hashMethod || 'md5').toLowerCase();
    const pwdExpr =
      method === 'wz_md5' ? 'dbo.fn_md5(@password, @username)' : '@passwordHash';

    const req = pool
      .request()
      .input('username', sql.VarChar(10), username)
      .input('password', sql.VarChar(20), password)
      .input('passwordHash', sql.VarChar(64), passwordHash)
      .input('membName', sql.VarChar(10), username)
      .input('snoNumb', sql.VarChar(13), snoNumb)
      .input('email', sql.VarChar(50), email);

    await req.query(`
      INSERT INTO MEMB_INFO (
        memb___id, memb__pwd, memb_name, sno__numb, mail_addr, bloc_code, ctl1_code
      ) VALUES (
        @username, ${pwdExpr}, @membName, @snoNumb, @email, 0, 0
      )
    `);

    return { created: true, existed: false, username };
  } finally {
    await pool.close();
  }
}

export async function createAdminAccountMock({ username, password, email }) {
  const { updateStore } = await import('../data/cmsStore.js');
  updateStore((s) => {
    const key = username.toLowerCase();
    s.mockAccounts = s.mockAccounts || {};
    if (!s.mockAccounts[key]) {
      s.mockAccounts[key] = {
        username,
        passwordHash: hashPasswordForInstall('md5', password, username),
        email,
        guid: Object.keys(s.mockAccounts).length + 1,
        bloc: 0,
        createdAt: new Date().toISOString(),
        balances: { credits: 0, wcoinc: 0, wcoinp: 0, goblin: 0 },
        vip: null,
      };
    }
    return s;
  });
  return { created: true, existed: false, username, mock: true };
}
