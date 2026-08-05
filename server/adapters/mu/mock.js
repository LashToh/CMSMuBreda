import { resolveClass } from '../../utils/classes.js';
import { hashPassword, passwordsMatch } from '../../utils/password.js';
import { readStore, updateStore } from '../../data/cmsStore.js';
import { AppError } from '../../utils/errors.js';
import { config } from '../../config/index.js';

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
    return MOCK_CHARS.length + 128;
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

function rankingPage(list, { page = 1, pageSize = 20 } = {}) {
  const total = list.length;
  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), total, page, pageSize };
}

const RANK_POOL = [
  ...MOCK_CHARS.map(mapChar),
  ...Array.from({ length: 40 }, (_, i) =>
    mapChar({
      name: `Hero${i + 1}`,
      account: `player${i + 1}`,
      classId: [0, 7, 14, 105, 70, 91][i % 6],
      level: 400 - (i % 50),
      masterLevel: 200 - i,
      resets: 50 - i,
      grandResets: Math.floor((50 - i) / 20),
      strength: 1000,
      agility: 800,
      vitality: 700,
      energy: 500,
      command: 0,
      pkLevel: 3 + (i % 4),
      pkCount: i * 3,
      map: 0,
      posX: 125,
      posY: 125,
      money: 0,
      levelUpPoint: 0,
      guild: i % 3 === 0 ? 'Lugard' : i % 3 === 1 ? 'Breda' : null,
      online: i % 5 === 0,
    }),
  ),
];

export const rankings = {
  /** Combined level ranking: cLevel + mLevel (WebEngine combine_level_masterlevel). */
  async byLevel(opts) {
    const sorted = [...RANK_POOL].sort(
      (a, b) =>
        (b.totalLevel ?? b.level + b.masterLevel) - (a.totalLevel ?? a.level + a.masterLevel) ||
        b.level - a.level ||
        a.name.localeCompare(b.name),
    );
    return rankingPage(sorted, opts);
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
    const sorted = [...RANK_POOL].sort((a, b) => b.pkCount - a.pkCount);
    return rankingPage(sorted, opts);
  },
  async byGuilds(opts) {
    const guilds = [
      { name: 'Lugard', master: 'Allen', score: 9800, members: 42 },
      { name: 'Breda', master: 'Hero3', score: 8700, members: 38 },
      { name: 'Aquilas', master: 'Hero6', score: 7200, members: 27 },
      { name: 'Temple', master: 'Hero9', score: 6100, members: 21 },
    ];
    return rankingPage(guilds, opts);
  },
};

export const guilds = {
  async count() {
    return 24;
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
    const onlinePlayers = RANK_POOL.filter((c) => c.online).length + 87;
    return {
      online: true,
      playersOnline: onlinePlayers,
      totalAccounts: await accounts.count(),
      totalCharacters: await characters.count(),
      totalGuilds: await guilds.count(),
      mode: 'mock',
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
