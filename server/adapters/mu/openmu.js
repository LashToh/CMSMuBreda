import bcrypt from 'bcryptjs';
import { pgQuery, getPgPool } from '../../db/pgPool.js';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/errors.js';
import { probeGameServer } from '../../utils/gameServerProbe.js';

/**
 * MU Database Adapter for OpenMU (Season 6, PostgreSQL). MU_BACKEND=openmu.
 *
 * Reads go straight to the OpenMU tables. Changes to an account that may be playing go
 * through the server: the web bridge plugin of the server (Breda.WebBridge, schema breda_web)
 * writes who is online and applies the currencies the web adds, also while the account plays.
 * Anything else that touches a character needs the account offline, as with Season 21.
 */

// Attribute definitions of OpenMU (MUnique.OpenMU.GameLogic.Attributes.Stats).
const STAT = {
  level: '560931ad-0901-4342-b7f4-fd2e2fcc0563',
  masterLevel: '70cd8c10-391a-4c51-9aa4-a854600e3a9f',
  resets: '89a891a7-f9f9-4ab5-af36-12056e53a5f7',
  strength: '123282fe-fead-448e-ad2c-baece939b4b1',
  agility: '1ae9c014-e3cd-4703-bd05-1b65f5f94ceb',
  vitality: '6ca5c3a6-b109-45a5-87a7-fdcb107b4982',
  energy: '01b0ef28-f7a0-46b5-97ba-2b624a54cd75',
  command: '6af2c9df-3ae4-4721-8462-9a8ec7f56fe4',
};

// MiniGameType of OpenMU.
const MINI_GAME = { devilSquare: 1, bloodCastle: 2, chaosCastle: 3, illusionTemple: 4 };

// AccountState of OpenMU: Banned and TemporarilyBanned.
const BLOCKED_STATES = [4, 5];

// GuildPosition.GuildMaster
const GUILD_MASTER = 2;

// The server writes breda_web.status every few seconds; older than this, it's down.
const STATUS_STALE_SECONDS = 30;

const CURRENCY_COLUMN = { wcoinc: 'WCoinC', wcoinp: 'WCoinP', goblin: 'GoblinPoints' };

const CLASS_SHORT = [
  [/wizard|soul master|grand master/i, 'DW'],
  [/knight|blade master/i, 'DK'],
  [/elf/i, 'FE'],
  [/gladiator|duel master/i, 'MG'],
  [/lord/i, 'DL'],
  [/summoner|dimension master/i, 'SU'],
  [/fighter|fist master/i, 'RF'],
];

/** OpenMU keeps the translations in the name ("Grand Master||de=Großmeister||..."): the first one is English. */
function className(raw) {
  return String(raw || '').split('||')[0].trim();
}

function classShort(name) {
  const hit = CLASS_SHORT.find(([re]) => re.test(name || ''));
  return hit ? hit[1] : '—';
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

function featureDisabled(message) {
  throw new AppError(message, { status: 503, code: 'FEATURE_DISABLED' });
}

// ---------------------------------------------------------------------------
// Web bridge (schema breda_web, written by the server)
// ---------------------------------------------------------------------------

/** The server status and who is online, or nobody when the server didn't write lately. */
async function bridgeState() {
  try {
    const status = await pgQuery(
      `SELECT players, EXTRACT(EPOCH FROM (now() - updated_at)) AS age FROM breda_web.status WHERE id = 1`,
    );
    const row = status[0];
    if (!row || Number(row.age) > STATUS_STALE_SECONDS) {
      return { alive: false, players: 0 };
    }
    return { alive: true, players: Number(row.players || 0) };
  } catch {
    // The server hasn't created the bridge yet (plugin off or never started).
    return { alive: false, players: 0 };
  }
}

async function onlineAccounts() {
  const state = await bridgeState();
  if (!state.alive) return new Set();
  try {
    const rows = await pgQuery(`SELECT lower(account) AS account FROM breda_web.online`);
    return new Set(rows.map((r) => r.account));
  } catch {
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

function statJoin(alias, key) {
  return `LEFT JOIN data."StatAttribute" ${alias}
            ON ${alias}."CharacterId" = c."Id" AND ${alias}."DefinitionId" = '${STAT[key]}'`;
}

const CHARACTER_FROM = `
  FROM data."Character" c
  JOIN data."Account" a ON a."Id" = c."AccountId"
  JOIN config."CharacterClass" cc ON cc."Id" = c."CharacterClassId"
  LEFT JOIN config."GameMapDefinition" m ON m."Id" = c."CurrentMapId"
  LEFT JOIN data."ItemStorage" inv ON inv."Id" = c."InventoryId"
  LEFT JOIN guild."GuildMember" gm ON gm."Id" = c."Id"
  LEFT JOIN guild."Guild" g ON g."Id" = gm."GuildId"
  ${statJoin('s_lv', 'level')}
  ${statJoin('s_ml', 'masterLevel')}
  ${statJoin('s_rs', 'resets')}
  ${statJoin('s_str', 'strength')}
  ${statJoin('s_agi', 'agility')}
  ${statJoin('s_vit', 'vitality')}
  ${statJoin('s_ene', 'energy')}
  ${statJoin('s_cmd', 'command')}`;

const CHARACTER_WHERE_REAL = `a."IsTemplate" = false AND a."IsBot" = false`;

const CHARACTER_SELECT = `
  c."Name" AS name,
  a."LoginName" AS account,
  cc."Number" AS class_number,
  cc."Name" AS class_name,
  COALESCE(s_lv."Value", 1)::int AS level,
  COALESCE(s_ml."Value", 0)::int AS master_level,
  COALESCE(s_rs."Value", 0)::int AS resets,
  COALESCE(s_str."Value", 0)::int AS strength,
  COALESCE(s_agi."Value", 0)::int AS agility,
  COALESCE(s_vit."Value", 0)::int AS vitality,
  COALESCE(s_ene."Value", 0)::int AS energy,
  s_cmd."Value"::int AS command,
  c."State" AS pk_level,
  c."PlayerKillCount" AS pk_count,
  COALESCE(m."Number", 0) AS map,
  c."PositionX" AS pos_x,
  c."PositionY" AS pos_y,
  COALESCE(inv."Money", 0) AS money,
  c."LevelUpPoints" AS level_up_point,
  g."Name" AS guild`;

function mapCharRow(row, online = new Set()) {
  const level = Number(row.level || 0);
  const masterLevel = Number(row.master_level || 0);
  return {
    name: row.name,
    account: row.account,
    classId: Number(row.class_number || 0),
    className: className(row.class_name),
    classShort: classShort(className(row.class_name)),
    level,
    masterLevel,
    totalLevel: level + masterLevel,
    resets: Number(row.resets || 0),
    grandResets: null,
    strength: Number(row.strength || 0),
    agility: Number(row.agility || 0),
    vitality: Number(row.vitality || 0),
    energy: Number(row.energy || 0),
    command: row.command != null ? Number(row.command) : null,
    pkLevel: Number(row.pk_level || 0),
    pkCount: Number(row.pk_count || 0),
    map: Number(row.map || 0),
    posX: Number(row.pos_x || 0),
    posY: Number(row.pos_y || 0),
    money: Number(row.money || 0),
    levelUpPoint: Number(row.level_up_point || 0),
    guild: row.guild || null,
    online: online.has(String(row.account || '').toLowerCase()),
  };
}

async function queryCharacters(where, params) {
  const rows = await pgQuery(
    `SELECT ${CHARACTER_SELECT} ${CHARACTER_FROM} WHERE ${CHARACTER_WHERE_REAL} AND ${where} ORDER BY c."CharacterSlot"`,
    params,
  );
  const online = await onlineAccounts();
  return rows.map((r) => mapCharRow(r, online));
}

async function pagedCharacterRanking(orderBy, opts, extraWhere = 'true') {
  const { page, pageSize, offset } = normalizePagination(opts);
  try {
    const totalRows = await pgQuery(
      `SELECT COUNT(*)::int AS total ${CHARACTER_FROM} WHERE ${CHARACTER_WHERE_REAL} AND ${extraWhere}`,
    );
    const rows = await pgQuery(
      `SELECT ${CHARACTER_SELECT} ${CHARACTER_FROM}
       WHERE ${CHARACTER_WHERE_REAL} AND ${extraWhere}
       ORDER BY ${orderBy}
       OFFSET $1 LIMIT $2`,
      [offset, pageSize],
    );
    const online = await onlineAccounts();
    return { items: rows.map((r) => mapCharRow(r, online)), total: totalRows[0]?.total ?? 0, page, pageSize };
  } catch (err) {
    console.error('[rankings.character]', err.message);
    return emptyRankingPage(opts);
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
  const rows = await queryCharacters(`c."Name" = $1 AND lower(a."LoginName") = lower($2)`, [
    characterName,
    username,
  ]);
  if (!rows.length) {
    throw new AppError('Character not found.', { status: 404, code: 'NOT_FOUND' });
  }
  return rows[0];
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

function mapAccount(row) {
  return {
    username: row.username,
    email: row.email,
    guid: row.id,
    bloc: BLOCKED_STATES.includes(Number(row.state)) ? 1 : 0,
    passwordHash: row.password_hash,
  };
}

const ACCOUNT_SELECT = `"Id" AS id, "LoginName" AS username, "EMail" AS email, "State" AS state, "PasswordHash" AS password_hash`;

export const accounts = {
  async findByUsername(username) {
    const rows = await pgQuery(
      `SELECT ${ACCOUNT_SELECT} FROM data."Account" WHERE lower("LoginName") = lower($1) LIMIT 1`,
      [username],
    );
    return rows[0] ? mapAccount(rows[0]) : null;
  },

  async findByEmail(email) {
    const rows = await pgQuery(
      `SELECT ${ACCOUNT_SELECT} FROM data."Account" WHERE lower("EMail") = lower($1) LIMIT 1`,
      [email],
    );
    if (!rows[0]) return null;
    const { passwordHash, ...rest } = mapAccount(rows[0]);
    return rest;
  },

  async create({ username, password, email }) {
    if (await accounts.findByUsername(username)) {
      throw new AppError('Username is already taken.', { status: 409, code: 'USERNAME_TAKEN' });
    }
    if (!config.registration.allowDuplicateEmails && (await accounts.findByEmail(email))) {
      throw new AppError('Email address is already registered.', {
        status: 409,
        code: 'EMAIL_TAKEN',
      });
    }

    // What the admin panel of OpenMU sets for a new account; the vault is created in game.
    const hash = await bcrypt.hash(password, 10);
    await pgQuery(
      `INSERT INTO data."Account" (
         "Id", "LoginName", "PasswordHash", "EMail", "SecurityCode", "LanguageIsoCode",
         "RegistrationDate", "State", "TimeZone", "VaultPassword", "IsVaultExtended",
         "WCoinC", "WCoinP", "GoblinPoints", "IsTemplate", "IsBot", "IsNetworkObservationActive")
       VALUES (gen_random_uuid(), $1, $2, $3, '', 'en', now(), 0, 0, '', false, 0, 0, 0, false, false, false)`,
      [username, hash, email],
    );
    return { username, email };
  },

  async validatePassword(username, password) {
    const acc = await accounts.findByUsername(username);
    if (!acc?.passwordHash) return false;
    try {
      return await bcrypt.compare(password, acc.passwordHash);
    } catch {
      return false;
    }
  },

  async changePassword(username, newPassword) {
    // The server never writes the password hash back, so it can change while the account plays.
    const hash = await bcrypt.hash(newPassword, 10);
    const pool = getPgPool();
    const result = await pool.query(
      `UPDATE data."Account" SET "PasswordHash" = $2 WHERE lower("LoginName") = lower($1)`,
      [username, hash],
    );
    if (!result.rowCount) {
      throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
    }
  },

  async changeEmail(username, newEmail) {
    const email = String(newEmail || '').trim().slice(0, 50);
    if (!config.registration.allowDuplicateEmails) {
      const taken = await accounts.findByEmail(email);
      if (taken && String(taken.username).toLowerCase() !== String(username).toLowerCase()) {
        throw new AppError('Email address is already registered.', {
          status: 409,
          code: 'EMAIL_TAKEN',
        });
      }
    }
    const result = await getPgPool().query(
      `UPDATE data."Account" SET "EMail" = $2 WHERE lower("LoginName") = lower($1)`,
      [username, email],
    );
    if (!result.rowCount) {
      throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
    }
  },

  async isOnline(username) {
    const online = await onlineAccounts();
    return online.has(String(username || '').toLowerCase());
  },

  async count() {
    const rows = await pgQuery(
      `SELECT COUNT(*)::int AS total FROM data."Account" WHERE "IsTemplate" = false AND "IsBot" = false`,
    );
    return rows[0]?.total ?? 0;
  },
};

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

export const characters = {
  async listByAccount(username) {
    return queryCharacters(`lower(a."LoginName") = lower($1)`, [username]);
  },

  async findByName(name) {
    const rows = await queryCharacters(`c."Name" = $1`, [name]);
    return rows[0] || null;
  },

  async count() {
    const rows = await pgQuery(
      `SELECT COUNT(*)::int AS total FROM data."Character" c JOIN data."Account" a ON a."Id" = c."AccountId" WHERE ${CHARACTER_WHERE_REAL}`,
    );
    return rows[0]?.total ?? 0;
  },

  async clearPk(username, characterName) {
    if (!config.features.clearPk) {
      featureDisabled('Clear PK is disabled.');
    }
    await ensureAccountOffline(username);
    await ensureCharacterOwned(username, characterName);
    await pgQuery(
      `UPDATE data."Character" c SET "State" = $3, "PlayerKillCount" = 0, "StateRemainingSeconds" = 0
       FROM data."Account" a
       WHERE a."Id" = c."AccountId" AND c."Name" = $1 AND lower(a."LoginName") = lower($2)`,
      [characterName, username, config.tools.clearPkLevel],
    );
  },

  async unstuck(username, characterName) {
    if (!config.features.unstuck) {
      featureDisabled('Unstuck is disabled.');
    }
    await ensureAccountOffline(username);
    await ensureCharacterOwned(username, characterName);
    const pool = getPgPool();
    const result = await pool.query(
      `UPDATE data."Character" c
       SET "CurrentMapId" = (SELECT "Id" FROM config."GameMapDefinition" WHERE "Number" = $3 LIMIT 1),
           "PositionX" = $4, "PositionY" = $5
       FROM data."Account" a
       WHERE a."Id" = c."AccountId" AND c."Name" = $1 AND lower(a."LoginName") = lower($2)`,
      [characterName, username, config.tools.unstuckMap, config.tools.unstuckX, config.tools.unstuckY],
    );
    if (!result.rowCount) {
      throw new AppError('Character not found.', { status: 404, code: 'NOT_FOUND' });
    }
  },

  async reset() {
    featureDisabled('Resets are done in game on this server.');
  },

  async grandReset() {
    featureDisabled('This server has no grand resets.');
  },
};

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

async function miniGameRanking(type, opts) {
  const { page, pageSize, offset } = normalizePagination(opts);
  // The best score of each character in that kind of event (every level of it together).
  const best = `
    SELECT e."CharacterId", MAX(e."Score") AS score
    FROM data."MiniGameRankingEntry" e
    JOIN config."MiniGameDefinition" d ON d."Id" = e."MiniGameId"
    WHERE d."Type" = $1 AND e."CharacterId" IS NOT NULL
    GROUP BY e."CharacterId"`;
  try {
    const totalRows = await pgQuery(`SELECT COUNT(*)::int AS total FROM (${best}) b`, [type]);
    const rows = await pgQuery(
      `SELECT b.score, c."Name" AS name, cc."Number" AS class_number, cc."Name" AS class_name, g."Name" AS guild
       FROM (${best}) b
       JOIN data."Character" c ON c."Id" = b."CharacterId"
       JOIN config."CharacterClass" cc ON cc."Id" = c."CharacterClassId"
       LEFT JOIN guild."GuildMember" gm ON gm."Id" = c."Id"
       LEFT JOIN guild."Guild" g ON g."Id" = gm."GuildId"
       ORDER BY b.score DESC, c."Name" ASC
       OFFSET $2 LIMIT $3`,
      [type, offset, pageSize],
    );
    return {
      items: rows.map((r) => ({
        name: r.name,
        score: Number(r.score || 0),
        points: Number(r.score || 0),
        classId: Number(r.class_number || 0),
        className: className(r.class_name),
        classShort: classShort(className(r.class_name)),
        guild: r.guild || null,
      })),
      total: totalRows[0]?.total ?? 0,
      page,
      pageSize,
    };
  } catch (err) {
    console.error('[rankings.miniGame]', err.message);
    return emptyRankingPage(opts);
  }
}

export const rankings = {
  /** Level + master level together, as on Season 21. */
  async byLevel(opts) {
    return pagedCharacterRanking(
      `(COALESCE(s_lv."Value", 1) + COALESCE(s_ml."Value", 0)) DESC, c."Experience" DESC, c."Name" ASC`,
      opts,
    );
  },

  async byMasterLevel(opts) {
    return pagedCharacterRanking(
      `COALESCE(s_ml."Value", 0) DESC, c."MasterExperience" DESC, c."Name" ASC`,
      opts,
      `COALESCE(s_ml."Value", 0) > 0`,
    );
  },

  async byResets(opts) {
    return pagedCharacterRanking(
      `COALESCE(s_rs."Value", 0) DESC, COALESCE(s_lv."Value", 1) DESC, c."Name" ASC`,
      opts,
      `COALESCE(s_rs."Value", 0) > 0`,
    );
  },

  async byGrandResets() {
    throw new AppError('This server has no grand resets ranking.', {
      status: 400,
      code: 'INVALID_TYPE',
    });
  },

  async byPk(opts) {
    return pagedCharacterRanking(`c."PlayerKillCount" DESC, c."Name" ASC`, opts, `c."PlayerKillCount" > 0`);
  },

  async byGuilds(opts) {
    const { page, pageSize, offset } = normalizePagination(opts);
    try {
      const totalRows = await pgQuery(`SELECT COUNT(*)::int AS total FROM guild."Guild"`);
      const rows = await pgQuery(
        `SELECT g."Name" AS name, g."Score" AS score,
           (SELECT c."Name" FROM guild."GuildMember" m JOIN data."Character" c ON c."Id" = m."Id"
             WHERE m."GuildId" = g."Id" AND m."Status" = ${GUILD_MASTER} LIMIT 1) AS master,
           (SELECT COUNT(*)::int FROM guild."GuildMember" m WHERE m."GuildId" = g."Id") AS members
         FROM guild."Guild" g
         ORDER BY g."Score" DESC, members DESC, g."Name" ASC
         OFFSET $1 LIMIT $2`,
        [offset, pageSize],
      );
      return {
        items: rows.map((r) => ({
          name: r.name,
          master: r.master,
          score: Number(r.score || 0),
          members: Number(r.members || 0),
        })),
        total: totalRows[0]?.total ?? 0,
        page,
        pageSize,
      };
    } catch (err) {
      console.error('[rankings.byGuilds]', err.message);
      return emptyRankingPage(opts);
    }
  },

  async byDevilSquare(opts) {
    return miniGameRanking(MINI_GAME.devilSquare, opts);
  },

  async byBloodCastle(opts) {
    return miniGameRanking(MINI_GAME.bloodCastle, opts);
  },

  async byChaosCastle(opts) {
    return miniGameRanking(MINI_GAME.chaosCastle, opts);
  },

  async byIllusionTemple(opts) {
    return miniGameRanking(MINI_GAME.illusionTemple, opts);
  },

  // OpenMU keeps no statistics of these.
  async byCastleSiege(opts) {
    return emptyRankingPage(opts);
  },

  async byDuel(opts) {
    return emptyRankingPage(opts);
  },
};

export const guilds = {
  async count() {
    const rows = await pgQuery(`SELECT COUNT(*)::int AS total FROM guild."Guild"`);
    return rows[0]?.total ?? 0;
  },
};

// ---------------------------------------------------------------------------
// Currencies (WCoinC, WCoinP, Goblin Points live on the account)
// ---------------------------------------------------------------------------

export const currency = {
  /** The balance on the account plus what the server hasn't applied yet. */
  async getBalances(username) {
    const balances = { credits: 0, wcoinc: 0, wcoinp: 0, goblin: 0 };
    const rows = await pgQuery(
      `SELECT "WCoinC" AS wcoinc, "WCoinP" AS wcoinp, "GoblinPoints" AS goblin
       FROM data."Account" WHERE lower("LoginName") = lower($1) LIMIT 1`,
      [username],
    );
    if (!rows[0]) return balances;
    for (const key of Object.keys(CURRENCY_COLUMN)) {
      balances[key] = Number(rows[0][key] || 0);
    }
    try {
      const pending = await pgQuery(
        `SELECT kind, SUM(amount)::int AS amount FROM breda_web.request
         WHERE done_at IS NULL AND lower(account) = lower($1) GROUP BY kind`,
        [username],
      );
      for (const p of pending) {
        if (p.kind in balances) balances[p.kind] += Number(p.amount || 0);
      }
    } catch {
      /* bridge not created yet */
    }
    return balances;
  },

  /** Donations and gift codes: the server applies it within seconds, also while the account plays. */
  async add(username, currencyKey, amount) {
    if (!CURRENCY_COLUMN[currencyKey]) {
      throw new AppError('Currency is not available on this server.', {
        status: 503,
        code: 'FEATURE_DISABLED',
      });
    }
    if (!(await accounts.findByUsername(username))) {
      throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
    }
    await pgQuery(`INSERT INTO breda_web.request (kind, account, amount) VALUES ($1, $2, $3)`, [
      currencyKey,
      username,
      Math.trunc(Number(amount) || 0),
    ]);
    return currency.getBalances(username);
  },

  /** Web shop: only offline, so the server doesn't overwrite the balance when it saves. */
  async deduct(username, currencyKey, amount) {
    const column = CURRENCY_COLUMN[currencyKey];
    if (!column) {
      throw new AppError('Currency is not available on this server.', {
        status: 503,
        code: 'FEATURE_DISABLED',
      });
    }
    await ensureAccountOffline(username);
    const result = await getPgPool().query(
      `UPDATE data."Account" SET "${column}" = "${column}" - $2
       WHERE lower("LoginName") = lower($1) AND "${column}" >= $2`,
      [username, Math.trunc(Number(amount) || 0)],
    );
    if (!result.rowCount) {
      throw new AppError('Insufficient balance.', { status: 400, code: 'INSUFFICIENT_FUNDS' });
    }
    return currency.getBalances(username);
  },
};

export const vip = {
  async getStatus() {
    return { active: false, type: 0, expiresAt: null };
  },
};

export const serverStats = {
  async get() {
    const gsProbe = await probeGameServer(
      config.server.gsHost,
      config.server.gsPort,
      config.server.gsCheckTimeoutMs,
    );
    try {
      const state = await bridgeState();
      const online = gsProbe === null ? state.alive : gsProbe;
      return {
        online,
        playersOnline: online ? state.players : 0,
        totalAccounts: await accounts.count(),
        totalCharacters: await characters.count(),
        totalGuilds: await guilds.count(),
        mode: config.muDatabaseMode,
        statusSource: gsProbe === null ? 'database' : 'gameserver',
      };
    } catch {
      return {
        online: gsProbe === true,
        playersOnline: 0,
        totalAccounts: 0,
        totalCharacters: 0,
        totalGuilds: 0,
        mode: config.muDatabaseMode,
        statusSource: gsProbe === null ? 'database' : 'gameserver',
        unavailable: gsProbe !== true,
      };
    }
  },
};

export const discovery = {
  async listTables() {
    const rows = await pgQuery(
      `SELECT table_schema AS "TABLE_SCHEMA", table_name AS "TABLE_NAME"
       FROM information_schema.tables
       WHERE table_type = 'BASE TABLE' AND table_schema IN ('data', 'guild', 'friend', 'config', 'breda_web')
       ORDER BY table_schema, table_name`,
    );
    return { tables: rows };
  },

  async listColumns(tableName) {
    const rows = await pgQuery(
      `SELECT table_schema AS "TABLE_SCHEMA", table_name AS "TABLE_NAME", column_name AS "COLUMN_NAME",
              data_type AS "DATA_TYPE", is_nullable AS "IS_NULLABLE", ordinal_position AS "ORDINAL_POSITION"
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [tableName],
    );
    return { columns: rows };
  },
};
