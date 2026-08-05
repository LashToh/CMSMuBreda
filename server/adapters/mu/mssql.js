import { getPool, getAccountsPool, sql } from '../../db/pool.js';
import { config } from '../../config/index.js';
import { resolveClass } from '../../utils/classes.js';
import { hashPassword, getPasswordSqlExpression, passwordsMatch } from '../../utils/password.js';
import { AppError } from '../../utils/errors.js';

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertIdentifier(name, label = 'identifier') {
  if (!name || !IDENT_RE.test(name)) {
    throw new AppError(`Invalid SQL ${label}.`, { status: 500, code: 'SCHEMA_ERROR' });
  }
  return name;
}

function qIdent(name) {
  return `[${assertIdentifier(name)}]`;
}

function normalizePagination({ page = 1, pageSize = 20 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
  return { page: p, pageSize: ps, offset: (p - 1) * ps };
}

function emptyRankingPage(opts) {
  const { page, pageSize } = normalizePagination(opts);
  return { items: [], total: 0, page, pageSize };
}

function schemaAccounts() {
  const a = config.mu.accounts;
  return {
    table: assertIdentifier(a.table, 'accounts table'),
    username: assertIdentifier(a.username, 'username column'),
    password: assertIdentifier(a.password, 'password column'),
    email: assertIdentifier(a.email, 'email column'),
    bloc: assertIdentifier(a.bloc, 'bloc column'),
    guid: assertIdentifier(a.guid, 'guid column'),
    name: assertIdentifier(a.name, 'memb_name column'),
    sno: assertIdentifier(a.sno, 'sno column'),
    ctl: assertIdentifier(a.ctl, 'ctl column'),
  };
}

function schemaCharacters() {
  const c = config.mu.characters;
  return {
    table: assertIdentifier(c.table, 'characters table'),
    name: assertIdentifier(c.name, 'character name column'),
    account: assertIdentifier(c.account, 'character account column'),
    class: assertIdentifier(c.class, 'class column'),
    level: assertIdentifier(c.level, 'level column'),
    resets: assertIdentifier(c.resets, 'resets column'),
    grandResets: assertIdentifier(c.grandResets, 'grandResets column'),
    masterLevel: assertIdentifier(c.masterLevel, 'masterLevel column'),
    strength: assertIdentifier(c.strength, 'strength column'),
    agility: assertIdentifier(c.agility, 'agility column'),
    vitality: assertIdentifier(c.vitality, 'vitality column'),
    energy: assertIdentifier(c.energy, 'energy column'),
    command: assertIdentifier(c.command, 'command column'),
    pkLevel: assertIdentifier(c.pkLevel, 'pkLevel column'),
    pkCount: assertIdentifier(c.pkCount, 'pkCount column'),
    map: assertIdentifier(c.map, 'map column'),
    posX: assertIdentifier(c.posX, 'posX column'),
    posY: assertIdentifier(c.posY, 'posY column'),
    money: assertIdentifier(c.money, 'money column'),
    levelUpPoint: assertIdentifier(c.levelUpPoint, 'levelUpPoint column'),
  };
}

function schemaMembStat() {
  const s = config.mu.membStat;
  return {
    table: assertIdentifier(s.table, 'membStat table'),
    username: assertIdentifier(s.username, 'membStat username column'),
    connectStat: assertIdentifier(s.connectStat, 'connectStat column'),
  };
}

function schemaGuild() {
  const g = config.mu.guild;
  return {
    table: assertIdentifier(g.table, 'guild table'),
    name: assertIdentifier(g.name, 'guild name column'),
    master: assertIdentifier(g.master, 'guild master column'),
    score: assertIdentifier(g.score, 'guild score column'),
  };
}

function schemaGuildMember() {
  const gm = config.mu.guildMember;
  return {
    table: assertIdentifier(gm.table, 'guildMember table'),
    name: assertIdentifier(gm.name, 'guildMember name column'),
    guild: assertIdentifier(gm.guild, 'guildMember guild column'),
  };
}

function coreCharColumns(c) {
  return [
    c.name,
    c.account,
    c.class,
    c.level,
    c.strength,
    c.agility,
    c.vitality,
    c.energy,
    c.pkLevel,
    c.pkCount,
    c.map,
    c.posX,
    c.posY,
    c.money,
    c.levelUpPoint,
  ];
}

function optionalCharColumns(c) {
  return [c.masterLevel, c.resets, c.grandResets, c.command];
}

function pickRowValue(row, col) {
  if (row == null || col == null) return null;
  if (Object.prototype.hasOwnProperty.call(row, col)) return row[col];
  return null;
}

async function fetchGuildName(charName) {
  try {
    const gm = schemaGuildMember();
    const pool = await getPool();
    const result = await pool
      .request()
      .input('charName', sql.VarChar(10), charName)
      .query(
        `SELECT TOP 1 ${qIdent(gm.guild)} AS guildName
         FROM ${qIdent(gm.table)}
         WHERE ${qIdent(gm.name)} = @charName`,
      );
    return result.recordset[0]?.guildName ?? null;
  } catch {
    return null;
  }
}

function mapCharRow(row, guild = null) {
  const c = schemaCharacters();
  const classId = Number(pickRowValue(row, c.class) ?? 0);
  const cls = resolveClass(classId);
  const level = Number(pickRowValue(row, c.level) ?? 0);
  const masterLevel =
    pickRowValue(row, c.masterLevel) != null ? Number(pickRowValue(row, c.masterLevel)) : null;
  return {
    name: pickRowValue(row, c.name),
    account: pickRowValue(row, c.account),
    classId,
    className: cls.name,
    classShort: cls.short,
    level,
    masterLevel,
    totalLevel: level + Number(masterLevel || 0),
    resets: pickRowValue(row, c.resets) != null ? Number(pickRowValue(row, c.resets)) : null,
    grandResets:
      pickRowValue(row, c.grandResets) != null ? Number(pickRowValue(row, c.grandResets)) : null,
    strength: Number(pickRowValue(row, c.strength) ?? 0),
    agility: Number(pickRowValue(row, c.agility) ?? 0),
    vitality: Number(pickRowValue(row, c.vitality) ?? 0),
    energy: Number(pickRowValue(row, c.energy) ?? 0),
    command: pickRowValue(row, c.command) != null ? Number(pickRowValue(row, c.command)) : null,
    pkLevel: Number(pickRowValue(row, c.pkLevel) ?? 0),
    pkCount: Number(pickRowValue(row, c.pkCount) ?? 0),
    map: Number(pickRowValue(row, c.map) ?? 0),
    posX: Number(pickRowValue(row, c.posX) ?? 0),
    posY: Number(pickRowValue(row, c.posY) ?? 0),
    money: Number(pickRowValue(row, c.money) ?? 0),
    levelUpPoint: Number(pickRowValue(row, c.levelUpPoint) ?? 0),
    guild,
    online: false,
  };
}

async function mapCharRows(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const c = schemaCharacters();
      const charName = pickRowValue(row, c.name);
      const guild = charName ? await fetchGuildName(charName) : null;
      return mapCharRow(row, guild);
    }),
  );
}

async function queryCharacterRows(whereSql, inputs = []) {
  const c = schemaCharacters();
  const allColumns = [...coreCharColumns(c), ...optionalCharColumns(c)];
  const pools = [allColumns, coreCharColumns(c)];

  for (const columns of pools) {
    try {
      const pool = await getPool();
      const request = pool.request();
      for (const { name, type, value } of inputs) {
        request.input(name, type, value);
      }
      const selectList = columns.map(qIdent).join(', ');
      const result = await request.query(
        `SELECT ${selectList}
         FROM ${qIdent(c.table)}
         WHERE ${whereSql}`,
      );
      return result.recordset;
    } catch {
      /* try narrower column set */
    }
  }
  return [];
}

function bindPasswordInputs(request, username, password) {
  request.input('username', sql.VarChar(10), username);
  request.input('password', sql.VarChar(20), password);
  request.input('passwordHash', sql.VarChar(32), hashPassword(password, username));
  if (config.hashMethod === 'sha256') {
    request.input('sha256Salt', sql.VarChar(255), config.sha256Salt || '');
  }
}

async function ensureAccountOffline(username) {
  if (await accounts.isOnline(username)) {
    throw new AppError('Account must be offline to perform this action.', {
      status: 400,
      code: 'ACCOUNT_ONLINE',
    });
  }
}

async function ensureCharacterOwned(username, characterName) {
  const c = schemaCharacters();
  const rows = await queryCharacterRows(
    `${qIdent(c.name)} = @charName AND ${qIdent(c.account)} = @username`,
    [
      { name: 'charName', type: sql.VarChar(10), value: characterName },
      { name: 'username', type: sql.VarChar(10), value: username },
    ],
  );
  if (!rows.length) {
    throw new AppError('Character not found.', { status: 404, code: 'NOT_FOUND' });
  }
  const guild = await fetchGuildName(characterName);
  return mapCharRow(rows[0], guild);
}

function featureDisabled(message) {
  throw new AppError(message, { status: 503, code: 'FEATURE_DISABLED' });
}

export const accounts = {
  async findByUsername(username) {
    const a = schemaAccounts();
    const pool = await getAccountsPool();
    const result = await pool
      .request()
      .input('username', sql.VarChar(10), username)
      .query(
        `SELECT TOP 1
           ${qIdent(a.username)} AS username,
           ${qIdent(a.email)} AS email,
           ${qIdent(a.guid)} AS guid,
           ${qIdent(a.bloc)} AS bloc,
           ${qIdent(a.password)} AS passwordHash
         FROM ${qIdent(a.table)}
         WHERE ${qIdent(a.username)} = @username`,
      );
    const row = result.recordset[0];
    if (!row) return null;
    return {
      username: row.username,
      email: row.email,
      guid: row.guid,
      bloc: row.bloc,
      passwordHash: row.passwordHash,
    };
  },

  async findByEmail(email) {
    const a = schemaAccounts();
    const pool = await getAccountsPool();
    const result = await pool
      .request()
      .input('email', sql.VarChar(50), email)
      .query(
        `SELECT TOP 1
           ${qIdent(a.username)} AS username,
           ${qIdent(a.email)} AS email,
           ${qIdent(a.guid)} AS guid,
           ${qIdent(a.bloc)} AS bloc
         FROM ${qIdent(a.table)}
         WHERE ${qIdent(a.email)} = @email`,
      );
    const row = result.recordset[0];
    if (!row) return null;
    return {
      username: row.username,
      email: row.email,
      guid: row.guid,
      bloc: row.bloc,
    };
  },

  async create({ username, password, email }) {
    const a = schemaAccounts();
    const pool = await getAccountsPool();

    const existing = await accounts.findByUsername(username);
    if (existing) {
      throw new AppError('Username is already taken.', { status: 409, code: 'USERNAME_TAKEN' });
    }

    if (!config.registration.allowDuplicateEmails) {
      const emailTaken = await accounts.findByEmail(email);
      if (emailTaken) {
        throw new AppError('Email address is already registered.', {
          status: 409,
          code: 'EMAIL_TAKEN',
        });
      }
    }

    const passwordExpr = getPasswordSqlExpression();
    const snoNumb = config.registration.defaultSnoNumb;
    const request = pool.request();
    bindPasswordInputs(request, username, password);
    request.input('membName', sql.VarChar(10), username);
    request.input('snoNumb', sql.VarChar(13), snoNumb);
    request.input('email', sql.VarChar(50), email);

    await request.query(
      `INSERT INTO ${qIdent(a.table)} (
         ${qIdent(a.username)},
         ${qIdent(a.password)},
         ${qIdent(a.name)},
         ${qIdent(a.sno)},
         ${qIdent(a.email)},
         ${qIdent(a.bloc)},
         ${qIdent(a.ctl)}
       ) VALUES (
         @username,
         ${passwordExpr},
         @membName,
         @snoNumb,
         @email,
         0,
         0
       )`,
    );

    return { username, email };
  },

  async validatePassword(username, password) {
    if (config.hashMethod === 'wz_md5') {
      const a = schemaAccounts();
      const pool = await getAccountsPool();
      const result = await pool
        .request()
        .input('username', sql.VarChar(10), username)
        .input('password', sql.VarChar(20), password)
        .query(
          `SELECT TOP 1 1 AS ok
           FROM ${qIdent(a.table)}
           WHERE ${qIdent(a.username)} = @username
             AND ${qIdent(a.password)} = ${getPasswordSqlExpression()}`,
        );
      return result.recordset.length > 0;
    }

    if (config.hashMethod === 'sha256') {
      const a = schemaAccounts();
      const pool = await getAccountsPool();
      const result = await pool
        .request()
        .input('username', sql.VarChar(10), username)
        .input('password', sql.VarChar(20), password)
        .input('sha256Salt', sql.VarChar(255), config.sha256Salt || '')
        .query(
          `SELECT TOP 1 1 AS ok
           FROM ${qIdent(a.table)}
           WHERE ${qIdent(a.username)} = @username
             AND ${qIdent(a.password)} = ${getPasswordSqlExpression()}`,
        );
      return result.recordset.length > 0;
    }

    const acc = await accounts.findByUsername(username);
    if (!acc) return false;
    return passwordsMatch(acc.passwordHash, password, username);
  },

  async changePassword(username, newPassword) {
    const a = schemaAccounts();
    const pool = await getAccountsPool();
    const request = pool.request();
    bindPasswordInputs(request, username, newPassword);

    const result = await request.query(
      `UPDATE ${qIdent(a.table)}
       SET ${qIdent(a.password)} = ${getPasswordSqlExpression()}
       WHERE ${qIdent(a.username)} = @username`,
    );

    if (!result.rowsAffected[0]) {
      throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
    }
  },

  async isOnline(username) {
    const ms = schemaMembStat();
    const pool = await getAccountsPool();
    const result = await pool
      .request()
      .input('username', sql.VarChar(10), username)
      .query(
        `SELECT TOP 1 1 AS ok
         FROM ${qIdent(ms.table)}
         WHERE ${qIdent(ms.username)} = @username
           AND ${qIdent(ms.connectStat)} = 1`,
      );
    return result.recordset.length > 0;
  },

  async count() {
    const a = schemaAccounts();
    const pool = await getAccountsPool();
    const result = await pool.request().query(
      `SELECT COUNT(*) AS total FROM ${qIdent(a.table)}`,
    );
    return Number(result.recordset[0]?.total ?? 0);
  },
};

export const characters = {
  async listByAccount(username) {
    const c = schemaCharacters();
    const rows = await queryCharacterRows(`${qIdent(c.account)} = @username`, [
      { name: 'username', type: sql.VarChar(10), value: username },
    ]);
    return mapCharRows(rows);
  },

  async findByName(name) {
    const c = schemaCharacters();
    const rows = await queryCharacterRows(`${qIdent(c.name)} = @charName`, [
      { name: 'charName', type: sql.VarChar(10), value: name },
    ]);
    if (!rows.length) return null;
    const guild = await fetchGuildName(name);
    return mapCharRow(rows[0], guild);
  },

  async count() {
    const c = schemaCharacters();
    const pool = await getPool();
    const result = await pool.request().query(
      `SELECT COUNT(*) AS total FROM ${qIdent(c.table)}`,
    );
    return Number(result.recordset[0]?.total ?? 0);
  },

  async clearPk(username, characterName) {
    if (!config.features.clearPk) {
      featureDisabled('Clear PK is disabled until Season 21 schema is verified.');
    }
    await ensureAccountOffline(username);
    await ensureCharacterOwned(username, characterName);

    const c = schemaCharacters();
    const pool = await getPool();
    const result = await pool
      .request()
      .input('charName', sql.VarChar(10), characterName)
      .input('username', sql.VarChar(10), username)
      .input('pkLevel', sql.Int, config.tools.clearPkLevel)
      .query(
        `UPDATE ${qIdent(c.table)}
         SET ${qIdent(c.pkLevel)} = @pkLevel,
             ${qIdent(c.pkCount)} = 0
         WHERE ${qIdent(c.name)} = @charName
           AND ${qIdent(c.account)} = @username`,
      );

    if (!result.rowsAffected[0]) {
      throw new AppError('Character not found.', { status: 404, code: 'NOT_FOUND' });
    }
  },

  async unstuck(username, characterName) {
    if (!config.features.unstuck) {
      featureDisabled('Unstuck is disabled.');
    }
    await ensureAccountOffline(username);
    await ensureCharacterOwned(username, characterName);

    const c = schemaCharacters();
    const pool = await getPool();
    const result = await pool
      .request()
      .input('charName', sql.VarChar(10), characterName)
      .input('username', sql.VarChar(10), username)
      .input('map', sql.Int, config.tools.unstuckMap)
      .input('posX', sql.Int, config.tools.unstuckX)
      .input('posY', sql.Int, config.tools.unstuckY)
      .query(
        `UPDATE ${qIdent(c.table)}
         SET ${qIdent(c.map)} = @map,
             ${qIdent(c.posX)} = @posX,
             ${qIdent(c.posY)} = @posY
         WHERE ${qIdent(c.name)} = @charName
           AND ${qIdent(c.account)} = @username`,
      );

    if (!result.rowsAffected[0]) {
      throw new AppError('Character not found.', { status: 404, code: 'NOT_FOUND' });
    }
  },

  async reset() {
    featureDisabled(
      'Character reset requires a Season 21 stored procedure mapping. Direct UPDATE is disabled for safety.',
    );
  },

  async grandReset() {
    featureDisabled(
      'Grand reset requires a Season 21 stored procedure mapping. Direct UPDATE is disabled for safety.',
    );
  },
};

async function pagedCharacterRanking(orderBySql, opts) {
  const { page, pageSize, offset } = normalizePagination(opts);
  const c = schemaCharacters();
  const columns = [...coreCharColumns(c), ...optionalCharColumns(c)];

  try {
    const pool = await getPool();
    const selectList = columns.map(qIdent).join(', ');
    const countResult = await pool.request().query(
      `SELECT COUNT(*) AS total FROM ${qIdent(c.table)}`,
    );
    const total = Number(countResult.recordset[0]?.total ?? 0);

    const itemsResult = await pool
      .request()
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, pageSize)
      .query(
        `SELECT ${selectList}
         FROM ${qIdent(c.table)}
         ORDER BY ${orderBySql}
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      );

    const items = await mapCharRows(itemsResult.recordset);
    return { items, total, page, pageSize };
  } catch {
    try {
      const pool = await getPool();
      const selectList = coreCharColumns(c).map(qIdent).join(', ');
      const countResult = await pool.request().query(
        `SELECT COUNT(*) AS total FROM ${qIdent(c.table)}`,
      );
      const total = Number(countResult.recordset[0]?.total ?? 0);
      const itemsResult = await pool
        .request()
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(
          `SELECT ${selectList}
           FROM ${qIdent(c.table)}
           ORDER BY ${orderBySql}
           OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
        );
      const items = await mapCharRows(itemsResult.recordset);
      return { items, total, page, pageSize };
    } catch {
      return emptyRankingPage(opts);
    }
  }
}

export const rankings = {
  /** Combined level ranking: cLevel + mLevel (WebEngine combine_level_masterlevel). */
  async byLevel(opts) {
    const c = schemaCharacters();
    try {
      return await pagedCharacterRanking(
        `(${qIdent(c.level)} + ISNULL(${qIdent(c.masterLevel)}, 0)) DESC, ${qIdent(c.level)} DESC, ${qIdent(c.name)} ASC`,
        opts,
      );
    } catch {
      return pagedCharacterRanking(`${qIdent(c.level)} DESC, ${qIdent(c.name)} ASC`, opts);
    }
  },

  async byMasterLevel() {
    throw new AppError('Master Level ranking is merged into Level (combined total).', {
      status: 400,
      code: 'INVALID_TYPE',
    });
  },

  async byResets() {
    throw new AppError('This server has no resets ranking.', {
      status: 400,
      code: 'INVALID_TYPE',
    });
  },

  async byGrandResets() {
    throw new AppError('This server has no grand resets ranking.', {
      status: 400,
      code: 'INVALID_TYPE',
    });
  },

  async byPk(opts) {
    const c = schemaCharacters();
    try {
      return await pagedCharacterRanking(
        `${qIdent(c.pkCount)} DESC, ${qIdent(c.name)} ASC`,
        opts,
      );
    } catch {
      return emptyRankingPage(opts);
    }
  },

  async byGuilds(opts) {
    const { page, pageSize, offset } = normalizePagination(opts);
    const g = schemaGuild();
    const gm = schemaGuildMember();

    try {
      const pool = await getPool();
      const countResult = await pool.request().query(
        `SELECT COUNT(*) AS total FROM ${qIdent(g.table)}`,
      );
      const total = Number(countResult.recordset[0]?.total ?? 0);

      const itemsResult = await pool
        .request()
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize)
        .query(
          `SELECT
             g.${qIdent(g.name)} AS name,
             g.${qIdent(g.master)} AS master,
             g.${qIdent(g.score)} AS score,
             (
               SELECT COUNT(*)
               FROM ${qIdent(gm.table)} gm
               WHERE gm.${qIdent(gm.guild)} = g.${qIdent(g.name)}
             ) AS members
           FROM ${qIdent(g.table)} g
           ORDER BY g.${qIdent(g.score)} DESC, g.${qIdent(g.name)} ASC
           OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
        );

      const items = itemsResult.recordset.map((row) => ({
        name: row.name,
        master: row.master,
        score: Number(row.score ?? 0),
        members: Number(row.members ?? 0),
      }));

      return { items, total, page, pageSize };
    } catch {
      return emptyRankingPage(opts);
    }
  },
};

export const guilds = {
  async count() {
    const g = schemaGuild();
    const pool = await getPool();
    const result = await pool.request().query(
      `SELECT COUNT(*) AS total FROM ${qIdent(g.table)}`,
    );
    return Number(result.recordset[0]?.total ?? 0);
  },
};

function configuredCurrencies() {
  return Object.entries(config.mu.currencies).filter(([, mapping]) => mapping?.table);
}

async function readCurrencyBalance(username, key, mapping) {
  const table = assertIdentifier(mapping.table, `${key} table`);
  const column = assertIdentifier(mapping.column, `${key} column`);
  const userColumn = assertIdentifier(mapping.userColumn, `${key} user column`);
  const pool = await getPool();
  const result = await pool
    .request()
    .input('username', sql.VarChar(10), username)
    .query(
      `SELECT TOP 1 ${qIdent(column)} AS balance
       FROM ${qIdent(table)}
       WHERE ${qIdent(userColumn)} = @username`,
    );
  return Number(result.recordset[0]?.balance ?? 0);
}

export const currency = {
  async getBalances(username) {
    const balances = {};
    for (const [key, mapping] of configuredCurrencies()) {
      if (!mapping.table) {
        balances[key] = 0;
        continue;
      }
      try {
        balances[key] = await readCurrencyBalance(username, key, mapping);
      } catch {
        balances[key] = 0;
      }
    }
    return balances;
  },

  async add(username, currencyKey, amount) {
    const mapping = config.mu.currencies[currencyKey];
    if (!mapping?.table) {
      throw new AppError('Currency is not configured.', { status: 503, code: 'FEATURE_DISABLED' });
    }

    const table = assertIdentifier(mapping.table, `${currencyKey} table`);
    const column = assertIdentifier(mapping.column, `${currencyKey} column`);
    const userColumn = assertIdentifier(mapping.userColumn, `${currencyKey} user column`);
    const pool = await getPool();

    const updateResult = await pool
      .request()
      .input('username', sql.VarChar(10), username)
      .input('amount', sql.Int, amount)
      .query(
        `UPDATE ${qIdent(table)}
         SET ${qIdent(column)} = ${qIdent(column)} + @amount
         WHERE ${qIdent(userColumn)} = @username`,
      );

    if (!updateResult.rowsAffected[0]) {
      throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
    }

    return currency.getBalances(username);
  },

  async deduct(username, currencyKey, amount) {
    const mapping = config.mu.currencies[currencyKey];
    if (!mapping?.table) {
      throw new AppError('Currency is not configured.', { status: 503, code: 'FEATURE_DISABLED' });
    }

    const current = await currency.getBalances(username);
    if ((current[currencyKey] || 0) < amount) {
      throw new AppError('Insufficient balance.', { status: 400, code: 'INSUFFICIENT_FUNDS' });
    }

    const table = assertIdentifier(mapping.table, `${currencyKey} table`);
    const column = assertIdentifier(mapping.column, `${currencyKey} column`);
    const userColumn = assertIdentifier(mapping.userColumn, `${currencyKey} user column`);
    const pool = await getPool();

    const updateResult = await pool
      .request()
      .input('username', sql.VarChar(10), username)
      .input('amount', sql.Int, amount)
      .query(
        `UPDATE ${qIdent(table)}
         SET ${qIdent(column)} = ${qIdent(column)} - @amount
         WHERE ${qIdent(userColumn)} = @username
           AND ${qIdent(column)} >= @amount`,
      );

    if (!updateResult.rowsAffected[0]) {
      throw new AppError('Insufficient balance.', { status: 400, code: 'INSUFFICIENT_FUNDS' });
    }

    return currency.getBalances(username);
  },
};

export const vip = {
  async getStatus(username) {
    const v = config.mu.vip;
    if (!config.features.vip || !v?.table) {
      return { active: false, type: 0, expiresAt: null };
    }

    try {
      const table = assertIdentifier(v.table, 'vip table');
      const userColumn = assertIdentifier(v.userColumn, 'vip user column');
      const typeColumn = assertIdentifier(v.typeColumn, 'vip type column');
      const dateColumn = assertIdentifier(v.dateColumn, 'vip date column');
      const pool = await getPool();
      const result = await pool
        .request()
        .input('username', sql.VarChar(10), username)
        .query(
          `SELECT TOP 1
             ${qIdent(typeColumn)} AS vipType,
             ${qIdent(dateColumn)} AS expiresAt
           FROM ${qIdent(table)}
           WHERE ${qIdent(userColumn)} = @username`,
        );

      const row = result.recordset[0];
      if (!row) return { active: false, type: 0, expiresAt: null };

      const expiresAt = row.expiresAt ? new Date(row.expiresAt).toISOString() : null;
      const active = expiresAt ? new Date(expiresAt) > new Date() : false;
      return {
        active,
        type: Number(row.vipType ?? 0),
        expiresAt,
      };
    } catch {
      return { active: false, type: 0, expiresAt: null };
    }
  },
};

export const serverStats = {
  async get() {
    try {
      const ms = schemaMembStat();
      const pool = await getAccountsPool();
      const onlineResult = await pool.request().query(
        `SELECT COUNT(*) AS total
         FROM ${qIdent(ms.table)}
         WHERE ${qIdent(ms.connectStat)} = 1`,
      );

      return {
        online: true,
        playersOnline: Number(onlineResult.recordset[0]?.total ?? 0),
        totalAccounts: await accounts.count(),
        totalCharacters: await characters.count(),
        totalGuilds: await guilds.count(),
        mode: config.muDatabaseMode,
      };
    } catch {
      return {
        online: false,
        playersOnline: 0,
        totalAccounts: 0,
        totalCharacters: 0,
        totalGuilds: 0,
        mode: config.muDatabaseMode,
      };
    }
  },
};

export const discovery = {
  async listTables() {
    const pool = await getPool();
    const result = await pool.request().query(
      `SELECT TABLE_SCHEMA, TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_SCHEMA, TABLE_NAME`,
    );
    return { tables: result.recordset };
  },

  async listColumns(tableName) {
    assertIdentifier(tableName, 'table name');
    const pool = await getPool();
    const result = await pool
      .request()
      .input('tableName', sql.NVarChar(128), tableName)
      .query(
        `SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, ORDINAL_POSITION
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_NAME = @tableName
         ORDER BY ORDINAL_POSITION`,
      );
    return { columns: result.recordset };
  },
};
