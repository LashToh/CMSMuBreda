import { mu } from '../adapters/mu/index.js';
import { config } from '../config/index.js';
import { ok } from '../utils/response.js';
import { readStore } from '../data/cmsStore.js';
import * as newsService from '../services/newsService.js';
import * as downloadsService from '../services/downloadsService.js';
import * as giftCodeService from '../services/giftCodeService.js';
import * as adminCp from '../services/adminCpService.js';
import {
  getSecretsPublicView,
  saveRuntimeSecretsAndEnv,
  getFullConfigView,
  saveFullConfig,
} from '../services/adminConfigService.js';
import * as aboutService from '../services/aboutService.js';

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
      donationTransactions: (store.donationTransactions || []).length,
      giftRedemptions: store.giftRedemptions.length,
      newsCount: store.news.length,
      recentAudit: store.auditLogs.slice(0, 20),
      features: adminCp.getCmsSettings().features,
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

export async function deleteDownload(req, res, next) {
  try {
    return ok(
      res,
      downloadsService.deleteDownload(req.params.id, req.user.username),
      'Download deleted.',
    );
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
    const settings = adminCp.getCmsSettings();
    return ok(res, {
      ...settings,
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

export async function saveSettings(req, res, next) {
  try {
    // Prefer full config service (live + .env + admin-secrets.json)
    const view = saveFullConfig(
      {
        server: req.body.server,
        features: req.body.features,
        general: req.body.general,
        auth: req.body.auth,
        tools: req.body.tools,
        currencies: req.body.currencies || req.body.currency,
        rateLimit: req.body.rateLimit,
        muSchema: req.body.muSchema,
        db: req.body.db,
        adminUsernames: req.body.adminUsernames,
        registration: req.body.registration,
        hash: req.body.hash,
      },
      req.user.username,
    );
    return ok(
      res,
      {
        ...adminCp.getCmsSettings(),
        full: view,
      },
      'Settings saved (live + .env). CORS / rate limits / DB pool may need Node restart.',
    );
  } catch (err) {
    return next(err);
  }
}

export async function getConfigFull(_req, res, next) {
  try {
    return ok(res, getFullConfigView());
  } catch (err) {
    return next(err);
  }
}

export async function saveConfigFull(req, res, next) {
  try {
    const view = saveFullConfig(req.body, req.user.username);
    return ok(
      res,
      view,
      'Config saved. Most values apply live; CORS / rate limits / DB may need restart.',
    );
  } catch (err) {
    return next(err);
  }
}

export async function searchAccounts(req, res, next) {
  try {
    const result = await adminCp.searchAccounts(req.query.q);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

export async function listDonationPackages(req, res, next) {
  try {
    return ok(res, { items: adminCp.listDonationPackagesAdmin() });
  } catch (err) {
    return next(err);
  }
}

export async function saveDonationPackage(req, res, next) {
  try {
    const item = adminCp.saveDonationPackage(req.body, req.user.username);
    return ok(res, { item }, 'Donation package saved.');
  } catch (err) {
    return next(err);
  }
}

export async function deleteDonationPackage(req, res, next) {
  try {
    return ok(
      res,
      adminCp.deleteDonationPackage(req.params.id, req.user.username),
      'Donation package deleted.',
    );
  } catch (err) {
    return next(err);
  }
}

export async function getSecrets(_req, res, next) {
  try {
    return ok(res, getSecretsPublicView());
  } catch (err) {
    return next(err);
  }
}

export async function saveSecrets(req, res, next) {
  try {
    const view = saveRuntimeSecretsAndEnv(req.body, req.user.username);
    return ok(res, view, 'Integrations saved. Providers update immediately; .env mirrored for restarts.');
  } catch (err) {
    return next(err);
  }
}

export async function getAbout(_req, res, next) {
  try {
    return ok(res, aboutService.getAbout({ applyLive: false }));
  } catch (err) {
    return next(err);
  }
}

export async function saveAbout(req, res, next) {
  try {
    const saved = aboutService.saveAbout(req.body, req.user?.username);
    return ok(res, saved, 'Server info saved.');
  } catch (err) {
    return next(err);
  }
}

export async function resetAbout(req, res, next) {
  try {
    const saved = aboutService.resetAbout(req.user?.username);
    return ok(res, saved, 'Server info reset to defaults.');
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
