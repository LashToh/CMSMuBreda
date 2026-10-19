import { resolveClass } from '../../utils/classes.js';
import { hashPassword, passwordsMatch } from '../../utils/password.js';
import { readStore, updateStore } from '../../data/cmsStore.js';
import { AppError } from '../../utils/errors.js';
import { config } from '../../config/index.js';
import { probeGameServer } from '../../utils/gameServerProbe.js';

const MOCK_CHARS = [
  {
    name: 'Allen',
    account: 'demo',
    classId: 105,
    level: 400,
    masterLevel: 120,
    resets: 12,
    grandResets: 1,
    strength: 1200,
    agility: 800,
    vitality: 900,
    energy: 400,
    command: 0,
    pkLevel: 3,
    pkCount: 0,
    map: 0,
    posX: 125,
    posY: 125,
    money: 50000000,
    levelUpPoint: 0,
    guild: 'Lugard',
    online: false,
  },
  {
    name: 'CrusaderX',
    account: 'demo',
    classId: 106,
    level: 380,
    masterLevel: 80,
    resets: 8,
    grandResets: 0,
    strength: 1000,
    agility: 700,
    vitality: 850,
    energy: 350,
    command: 0,
    pkLevel: 6,
    pkCount: 14,
    map: 51,
    posX: 50,
    posY: 50,
    money: 12000000,
    levelUpPoint: 50,
    guild: null,
    online: true,
  },
];

function mapChar(c) {
  const cls = resolveClass(c.classId);
  const level = c.level;
  const masterLevel = c.masterLevel;
  return {
    name: c.name,
    account: c.account,
    classId: c.classId,
    className: cls.name,
    classShort: cls.short,
    level,
    masterLevel,
    totalLevel: Number(level || 0) + Number(masterLevel || 0),
    resets: c.resets,
    grandResets: c.grandResets,
    strength: c.strength,
    agility: c.agility,
    vitality: c.vitality,
    energy: c.energy,
    command: c.command,
    pkLevel: c.pkLevel,
    pkCount: c.pkCount,
    map: c.map,
    posX: c.posX,
    posY: c.posY,
    money: c.money,
    levelUpPoint: c.levelUpPoint,
    guild: c.guild,
    online: c.online,
  };
}

function ensureDemoAccount() {
  const store = readStore();
  if (!store.mockAccounts.demo) {
    updateStore((s) => {
      s.mockAccounts.demo = {
        username: 'demo',
        passwordHash: hashPassword('demo1234', 'demo'),
        email: 'demo@mubreda.local',
        guid: 1,
        bloc: 0,
        createdAt: new Date().toISOString(),
        balances: { credits: 1000, wcoinc: 250, wcoinp: 0, goblin: 100 },
        vip: { type: 1, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() },
      };
      return s;
    });
  }
}

ensureDemoAccount();

export const accounts = {
  async findByUsername(username) {
    const store = readStore();
    const acc = store.mockAccounts[username.toLowerCase()];
    if (!acc) return null;
    return {
      username: acc.username,
      email: acc.email,
      guid: acc.guid,
      bloc: acc.bloc,
      passwordHash: acc.passwordHash,
    };
  },

  async findByEmail(email) {
    const store = readStore();
    const acc = Object.values(store.mockAccounts).find(
      (a) => a.email.toLowerCase() === String(email).toLowerCase(),
    );
    if (!acc) return null;
    return { username: acc.username, email: acc.email, guid: acc.guid, bloc: acc.bloc };
  },

  async create({ username, password, email }) {
    const key = username.toLowerCase();
    const store = readStore();
    if (store.mockAccounts[key]) {
      throw new AppError('Username is already taken.', { status: 409, code: 'USERNAME_TAKEN' });
    }
    if (
      !config.registration.allowDuplicateEmails &&
      Object.values(store.mockAccounts).some((a) => a.email.toLowerCase() === email.toLowerCase())
    ) {
      throw new AppError('Email address is already registered.', {
        status: 409,
        code: 'EMAIL_TAKEN',
      });
    }
    updateStore((s) => {
      const guid = Object.keys(s.mockAccounts).length + 1;
      s.mockAccounts[key] = {
        username,
        passwordHash: hashPassword(password, username),
        email,
        guid,
        bloc: 0,
        createdAt: new Date().toISOString(),
        balances: { credits: 0, wcoinc: 0, wcoinp: 0, goblin: 0 },
        vip: null,
      };
      return s;
    });
    return { username, email };
  },

  async validatePassword(username, password) {
    const acc = await accounts.findByUsername(username);
    if (!acc) return false;
    return passwordsMatch(acc.passwordHash, password, username);
  },

  async changePassword(username, newPassword) {
    updateStore((s) => {
      const key = username.toLowerCase();
      if (!s.mockAccounts[key]) {
        throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
      }
      s.mockAccounts[key].passwordHash = hashPassword(newPassword, username);
      return s;
    });
  },

  async changeEmail(username, newEmail) {
    const email = String(newEmail || '')
      .trim()
      .toLowerCase();
    updateStore((s) => {
      const key = username.toLowerCase();
      if (!s.mockAccounts[key]) {
        throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
      }
      const taken = Object.values(s.mockAccounts).some(
        (a) =>
          a.username.toLowerCase() !== key && String(a.email).toLowerCase() === email,
      );
      if (taken && !config.registration.allowDuplicateEmails) {
        throw new AppError('Email address is already registered.', {
          status: 409,
          code: 'EMAIL_TAKEN',
        });
      }
      s.mockAccounts[key].email = email;
      return s;
    });
  },

  async isOnline(username) {
    return MOCK_CHARS.some((c) => c.account.toLowerCase() === username.toLowerCase() && c.online);
  },

  async count() {
    return Object.keys(readStore().mockAccounts).length;
  },
};

export const characters = {
  async listByAccount(username) {
    return MOCK_CHARS.filter((c) => c.account.toLowerCase() === username.toLowerCase()).map(mapChar);
  },

  async findByName(name) {
    const c = MOCK_CHARS.find((x) => x.name.toLowerCase() === String(name).toLowerCase());
    return c ? mapChar(c) : null;
  },

  async count() {
    return MOCK_CHARS.length;
  },

  async clearPk() {
    throw new AppError('Clear PK is disabled until Season 21 schema is verified.', {
      status: 503,
      code: 'FEATURE_DISABLED',
    });
  },

  async unstuck(username, characterName) {
    if (!config.features.unstuck) {
      throw new AppError('Unstuck is disabled.', { status: 503, code: 'FEATURE_DISABLED' });
    }
    const c = MOCK_CHARS.find(
      (x) =>
        x.account.toLowerCase() === String(username).toLowerCase() &&
        x.name.toLowerCase() === String(characterName).toLowerCase(),
    );
    if (!c) {
      throw new AppError('Character not found.', { status: 404, code: 'NOT_FOUND' });
    }
    if (c.online) {
      throw new AppError('Character must be offline.', { status: 400, code: 'ACCOUNT_ONLINE' });
    }
    c.map = config.tools.unstuckMap;
    c.posX = config.tools.unstuckX;
    c.posY = config.tools.unstuckY;
    return {
      name: c.name,
      map: c.map,
      posX: c.posX,
      posY: c.posY,
    };
  },

  async reset() {
    throw new AppError('Reset is disabled until Season 21 reset logic is verified.', {
      status: 503,
      code: 'FEATURE_DISABLED',
    });
  },

  async grandReset() {
    throw new AppError('Grand Reset is disabled until compatibility is confirmed.', {
      status: 503,
      code: 'FEATURE_DISABLED',
    });
  },
};

function emptyRanking(opts) {
  const page = Math.max(1, Number(opts?.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(opts?.pageSize) || 20));
  return { items: [], total: 0, page, pageSize };
}

export const rankings = {
  /**
   * Mock mode does not invent ranking rows (Hero01…).
   * Real rankings come from MSSQL Character/Guild when MU_DATABASE_MODE=production.
   */
  async byLevel(opts) {
    return emptyRanking(opts);
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
    return emptyRanking(opts);
  },
  async byGuilds(opts) {
    return emptyRanking(opts);
  },
  async byDevilSquare(opts) {
    return emptyRanking(opts);
  },
  async byBloodCastle(opts) {
    return emptyRanking(opts);
  },
  async byCastleSiege(opts) {
    return emptyRanking(opts);
  },
  async byChaosCastle(opts) {
    return emptyRanking(opts);
  },
  async byDuel(opts) {
    return emptyRanking(opts);
  },
  async byIllusionTemple(opts) {
    return emptyRanking(opts);
  },
};

export const guilds = {
  async count() {
    return 0;
  },
};

export const currency = {
  async getBalances(username) {
    const store = readStore();
    const acc = store.mockAccounts[username.toLowerCase()];
    return acc?.balances || { credits: 0, wcoinc: 0, wcoinp: 0, goblin: 0 };
  },

  async add(username, currencyKey, amount) {
    updateStore((s) => {
      const acc = s.mockAccounts[username.toLowerCase()];
      if (!acc) throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
      acc.balances[currencyKey] = (acc.balances[currencyKey] || 0) + amount;
      return s;
    });
    return currency.getBalances(username);
  },

  async deduct(username, currencyKey, amount) {
    const bal = await currency.getBalances(username);
    if ((bal[currencyKey] || 0) < amount) {
      throw new AppError('Insufficient balance.', { status: 400, code: 'INSUFFICIENT_FUNDS' });
    }
    return currency.add(username, currencyKey, -amount);
  },
};

export const vip = {
  async getStatus(username) {
    const store = readStore();
    const acc = store.mockAccounts[username.toLowerCase()];
    if (!acc?.vip) return { active: false, type: 0, expiresAt: null };
    const active = new Date(acc.vip.expiresAt) > new Date();
    return { active, type: acc.vip.type, expiresAt: acc.vip.expiresAt };
  },
};

export const serverStats = {
  async get() {
    // Mock mode simulates player counts. Set MU_DATABASE_MODE=production
    // to read MEMB_STAT from the real MU database.
    const gsProbe = await probeGameServer(
      config.server.gsHost,
      config.server.gsPort,
      config.server.gsCheckTimeoutMs,
    );
    const online = gsProbe === null ? false : gsProbe;

    return {
      online,
      // No invented online counts in mock — use production DB for real numbers.
      playersOnline: 0,
      totalAccounts: await accounts.count(),
      totalCharacters: await characters.count(),
      totalGuilds: await guilds.count(),
      mode: 'mock',
      statusSource: gsProbe === null ? 'mock' : 'gameserver',
    };
  },
};

export const discovery = {
  async listTables() {
    return { note: 'Schema discovery unavailable in mock mode.', tables: [] };
  },
  async listColumns() {
    return { note: 'Schema discovery unavailable in mock mode.', columns: [] };
  },
};
