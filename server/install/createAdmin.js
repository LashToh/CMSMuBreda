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

async function getMembInfoColumns(pool) {
  const result = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'MEMB_INFO'
      AND COLUMN_NAME IN (
        'memb___id', 'memb__pwd', 'memb_name', 'sno__numb', 'mail_addr'
      )
  `);
  const map = {};
  for (const row of result.recordset) {
    map[String(row.COLUMN_NAME).toLowerCase()] = {
      dataType: String(row.DATA_TYPE || '').toLowerCase(),
      maxLen: row.CHARACTER_MAXIMUM_LENGTH == null ? null : Number(row.CHARACTER_MAXIMUM_LENGTH),
    };
  }
  return map;
}

function clip(value, maxLen) {
  const s = String(value ?? '');
  if (maxLen == null || maxLen < 0 || !Number.isFinite(maxLen)) return s;
  return s.slice(0, maxLen);
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
      return { created: false, existed: true, username };
    }

    const cols = await getMembInfoColumns(pool);
    const pwdCol = cols.memb__pwd || { dataType: 'varchar', maxLen: 10 };
    const mailCol = cols.mail_addr || { dataType: 'varchar', maxLen: 50 };
    const nameCol = cols.memb_name || { dataType: 'varchar', maxLen: 10 };
    const snoCol = cols.sno__numb || { dataType: 'varchar', maxLen: 13 };

    const method = String(hashMethod || 'md5').toLowerCase();
    const md5Hex = hashPasswordForInstall('md5', password, username);
    const isBinaryPwd = pwdCol.dataType.includes('binary');
    const pwdMax = pwdCol.maxLen;

    let pwdExpr = '@passwordHash';
    const req = pool
      .request()
      .input('username', sql.VarChar(10), clip(username, 10))
      .input('password', sql.VarChar(20), password)
      .input('membName', sql.VarChar(10), clip(username, nameCol.maxLen ?? 10))
      .input('snoNumb', sql.VarChar(18), clip(snoNumb, snoCol.maxLen ?? 13))
      .input('email', sql.VarChar(60), clip(email, mailCol.maxLen ?? 50));

    if (method === 'wz_md5') {
      pwdExpr = 'dbo.fn_md5(@password, @username)';
    } else if (isBinaryPwd && method === 'md5') {
      // IGCN / MuDevs often store raw MD5 bytes in varbinary(16)
      req.input('passwordHash', sql.VarChar(32), md5Hex);
      pwdExpr = 'CONVERT(VARBINARY(16), @passwordHash, 2)';
    } else if (method === 'md5' && pwdMax != null && pwdMax > 0 && pwdMax < 32) {
      // Classic char(10)/varchar(10): JoinServer expects plain password, not hex MD5
      req.input('passwordHash', sql.VarChar(Math.max(pwdMax, 10)), clip(password, pwdMax));
      pwdExpr = '@passwordHash';
    } else if (method === 'sha256') {
      const hex = hashPasswordForInstall('sha256', password, username);
      if (isBinaryPwd) {
        req.input('passwordHash', sql.VarChar(64), hex);
        pwdExpr = 'CONVERT(VARBINARY(32), @passwordHash, 2)';
      } else {
        req.input('passwordHash', sql.VarChar(64), clip(hex, pwdMax ?? 64));
      }
    } else if (method === 'plain') {
      req.input('passwordHash', sql.VarChar(Math.max(pwdMax || 10, 10)), clip(password, pwdMax ?? 10));
    } else {
      // md5 hex into a wide enough varchar/char column
      req.input('passwordHash', sql.VarChar(64), clip(md5Hex, pwdMax ?? 32));
    }

    await req.query(`
      INSERT INTO MEMB_INFO (
        memb___id, memb__pwd, memb_name, sno__numb, mail_addr, bloc_code, ctl1_code
      ) VALUES (
        @username, ${pwdExpr}, @membName, @snoNumb, @email, 0, 0
      )
    `);

    return {
      created: true,
      existed: false,
      username,
      passwordStorage: isBinaryPwd
        ? 'binary'
        : pwdMax != null && pwdMax < 32 && method === 'md5'
          ? 'plain-truncated'
          : method,
    };
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
