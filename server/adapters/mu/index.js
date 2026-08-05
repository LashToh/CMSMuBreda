import { config } from '../../config/index.js';
import * as mock from './mock.js';
import * as mssqlAdapter from './mssql.js';

/**
 * MU Database Adapter facade.
 * Controllers/services talk only to this layer — never raw SQL.
 */
function pick() {
  return config.isMock ? mock : mssqlAdapter;
}

export const mu = {
  mode: () => config.muDatabaseMode,
  isMock: () => config.isMock,

  accounts: {
    findByUsername: (...a) => pick().accounts.findByUsername(...a),
    findByEmail: (...a) => pick().accounts.findByEmail(...a),
    create: (...a) => pick().accounts.create(...a),
    validatePassword: (...a) => pick().accounts.validatePassword(...a),
    changePassword: (...a) => pick().accounts.changePassword(...a),
    isOnline: (...a) => pick().accounts.isOnline(...a),
    count: (...a) => pick().accounts.count(...a),
  },

  characters: {
    listByAccount: (...a) => pick().characters.listByAccount(...a),
    findByName: (...a) => pick().characters.findByName(...a),
    count: (...a) => pick().characters.count(...a),
    clearPk: (...a) => pick().characters.clearPk(...a),
    unstuck: (...a) => pick().characters.unstuck(...a),
    reset: (...a) => pick().characters.reset(...a),
    grandReset: (...a) => pick().characters.grandReset(...a),
  },

  rankings: {
    byLevel: (...a) => pick().rankings.byLevel(...a),
    byMasterLevel: (...a) => pick().rankings.byMasterLevel(...a),
    byResets: (...a) => pick().rankings.byResets(...a),
    byGrandResets: (...a) => pick().rankings.byGrandResets(...a),
    byPk: (...a) => pick().rankings.byPk(...a),
    byGuilds: (...a) => pick().rankings.byGuilds(...a),
  },

  guilds: {
    count: (...a) => pick().guilds.count(...a),
  },

  currency: {
    getBalances: (...a) => pick().currency.getBalances(...a),
    add: (...a) => pick().currency.add(...a),
    deduct: (...a) => pick().currency.deduct(...a),
  },

  vip: {
    getStatus: (...a) => pick().vip.getStatus(...a),
  },

  serverStats: {
    get: (...a) => pick().serverStats.get(...a),
  },

  /** Read-only schema discovery — production only, SELECT-based. */
  discovery: {
    listTables: (...a) => pick().discovery?.listTables?.(...a),
    listColumns: (...a) => pick().discovery?.listColumns?.(...a),
  },
};

export default mu;
