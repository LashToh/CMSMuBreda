import { mu } from '../adapters/mu/index.js';
import { config } from '../config/index.js';
import { ok } from '../utils/response.js';
import { readStore } from '../data/cmsStore.js';
import * as newsService from '../services/newsService.js';
import * as downloadsService from '../services/downloadsService.js';
import * as giftCodeService from '../services/giftCodeService.js';

export async function dashboard(req, res, next) {
  try {
    let stats = {
      accounts: null,
      characters: null,
      guilds: null,
      playersOnline: null,
    };
    try {
      const s = await mu.serverStats.get();
      stats = {
        accounts: s.totalAccounts,
        characters: s.totalCharacters,
        guilds: s.totalGuilds,
        playersOnline: s.playersOnline,
      };
    } catch (err) {
      console.error('[admin.dashboard]', err.message);
    }

    const store = readStore();
    return ok(res, {
      stats,
      webshopPurchases: store.shopPurchases.length,
      giftRedemptions: store.giftRedemptions.length,
      newsCount: store.news.length,
      recentAudit: store.auditLogs.slice(0, 20),
      features: config.features,
      mode: config.muDatabaseMode,
    });
  } catch (err) {
    return next(err);
  }
}

export async function listNews(_req, res, next) {
  try {
    return ok(res, { items: readStore().news });
  } catch (err) {
    return next(err);
  }
}

export async function createNews(req, res, next) {
  try {
    const item = newsService.createNews(req.body, req.user.username);
    return ok(res, { item }, 'News created.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateNews(req, res, next) {
  try {
    const item = newsService.updateNews(req.params.id, req.body, req.user.username);
    return ok(res, { item }, 'News updated.');
  } catch (err) {
    return next(err);
  }
}

export async function deleteNews(req, res, next) {
  try {
    return ok(res, newsService.deleteNews(req.params.id, req.user.username), 'News deleted.');
  } catch (err) {
    return next(err);
  }
}

export async function listDownloads(_req, res, next) {
  try {
    return ok(res, { items: downloadsService.listDownloads() });
  } catch (err) {
    return next(err);
  }
}

export async function upsertDownload(req, res, next) {
  try {
    const item = downloadsService.upsertDownload(req.body, req.user.username);
    return ok(res, { item }, 'Download saved.');
  } catch (err) {
    return next(err);
  }
}

export async function listGiftCodes(_req, res, next) {
  try {
    return ok(res, { items: giftCodeService.listCodesAdmin() });
  } catch (err) {
    return next(err);
  }
}

export async function createGiftCode(req, res, next) {
  try {
    const item = giftCodeService.createCodeAdmin({
      ...req.body,
      adminUsername: req.user.username,
    });
    return ok(res, { item }, 'Gift code created.', 201);
  } catch (err) {
    return next(err);
  }
}

export async function auditLogs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    return ok(res, { items: readStore().auditLogs.slice(0, limit) });
  } catch (err) {
    return next(err);
  }
}

export async function configView(_req, res, next) {
  try {
    return ok(res, {
      server: config.server,
      features: config.features,
      muDatabaseMode: config.muDatabaseMode,
      hashMethod: config.hashMethod,
      // Never expose secrets / DB passwords
      schema: {
        accountsTable: config.mu.accounts.table,
        charactersTable: config.mu.characters.table,
        currencies: Object.fromEntries(
          Object.entries(config.mu.currencies).map(([k, v]) => [
            k,
            { table: v.table || null, column: v.column, userColumn: v.userColumn },
          ]),
        ),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function discoverTables(_req, res, next) {
  try {
    const result = await mu.discovery.listTables();
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function discoverColumns(req, res, next) {
  try {
    const result = await mu.discovery.listColumns(req.params.table);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}
