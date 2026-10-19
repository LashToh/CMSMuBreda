import { mu } from '../adapters/mu/index.js';
import { config } from '../config/index.js';
import { ok, paginated, fail } from '../utils/response.js';
import * as newsService from '../services/newsService.js';
import * as downloadsService from '../services/downloadsService.js';
import * as shopService from '../services/shopService.js';
import * as giftCodeService from '../services/giftCodeService.js';
import * as voteService from '../services/voteService.js';
import * as aboutService from '../services/aboutService.js';

export async function health(_req, res) {
  return ok(res, {
    service: 'cms-mubreda-api',
    mode: config.muDatabaseMode,
    season: config.server.season,
  });
}

export async function serverInfo(_req, res, next) {
  try {
    let stats;
    try {
      stats = await mu.serverStats.get();
    } catch (err) {
      console.error('[serverInfo]', err.message);
      stats = {
        online: false,
        playersOnline: null,
        totalAccounts: null,
        totalCharacters: null,
        totalGuilds: null,
        unavailable: true,
      };
    }

    return ok(res, {
      name: config.server.name,
      season: config.server.season,
      exp: config.server.exp,
      masterExp: config.server.masterExp,
      drop: config.server.drop,
      maxLevel: config.server.maxLevel,
      maxMasterLevel: config.server.maxMasterLevel,
      resetLevel: config.server.resetLevel,
      discordUrl: config.server.discordUrl,
      downloadUrl: config.server.downloadUrl,
      stats,
      features: config.features,
    });
  } catch (err) {
    return next(err);
  }
}

export async function about(_req, res, next) {
  try {
    return ok(res, aboutService.getAbout({ applyLive: true }));
  } catch (err) {
    return next(err);
  }
}

export async function rankings(req, res, next) {
  try {
    if (!config.features.rankings) {
      return fail(res, 503, 'FEATURE_DISABLED', 'Rankings temporarily unavailable.');
    }
    const type = req.params.type || 'level';
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);

    // This server has no resets / grand resets; level + master level are a single board.
    const removed = new Set(['master', 'resets', 'grandresets', 'grand-resets']);
    if (removed.has(type)) {
      return fail(
        res,
        400,
        'INVALID_TYPE',
        'Ranking type not supported. Use level, pk, guilds, or event rankings.',
      );
    }

    const map = {
      level: () => mu.rankings.byLevel({ page, pageSize }),
      pk: () => mu.rankings.byPk({ page, pageSize }),
      guilds: () => mu.rankings.byGuilds({ page, pageSize }),
      'devil-square': () => mu.rankings.byDevilSquare({ page, pageSize }),
      devilsquare: () => mu.rankings.byDevilSquare({ page, pageSize }),
      ds: () => mu.rankings.byDevilSquare({ page, pageSize }),
      'blood-castle': () => mu.rankings.byBloodCastle({ page, pageSize }),
      bloodcastle: () => mu.rankings.byBloodCastle({ page, pageSize }),
      bc: () => mu.rankings.byBloodCastle({ page, pageSize }),
      'castle-siege': () => mu.rankings.byCastleSiege({ page, pageSize }),
      castlesiege: () => mu.rankings.byCastleSiege({ page, pageSize }),
      cs: () => mu.rankings.byCastleSiege({ page, pageSize }),
      'chaos-castle': () => mu.rankings.byChaosCastle({ page, pageSize }),
      chaoscastle: () => mu.rankings.byChaosCastle({ page, pageSize }),
      cc: () => mu.rankings.byChaosCastle({ page, pageSize }),
      duel: () => mu.rankings.byDuel({ page, pageSize }),
      'illusion-temple': () => mu.rankings.byIllusionTemple({ page, pageSize }),
      illusiontemple: () => mu.rankings.byIllusionTemple({ page, pageSize }),
      it: () => mu.rankings.byIllusionTemple({ page, pageSize }),
    };
    const fn = map[String(type).toLowerCase()];
    if (!fn) return fail(res, 400, 'INVALID_TYPE', 'Unknown ranking type.');
    try {
      const result = await fn();
      return paginated(res, result);
    } catch (err) {
      console.error('[rankings]', err.message);
      return fail(res, 503, 'UNAVAILABLE', 'Rankings temporarily unavailable.');
    }
  } catch (err) {
    return next(err);
  }
}

export async function newsList(req, res, next) {
  try {
    if (!config.features.news) return ok(res, { items: [] });
    return ok(res, { items: newsService.listNews({ type: req.query.type }) });
  } catch (err) {
    return next(err);
  }
}

export async function newsOne(req, res, next) {
  try {
    return ok(res, { item: newsService.getNews(req.params.id) });
  } catch (err) {
    return next(err);
  }
}

export async function downloads(_req, res, next) {
  try {
    if (!config.features.downloads) return ok(res, { items: [] });
    return ok(res, { items: downloadsService.listDownloads() });
  } catch (err) {
    return next(err);
  }
}

export async function shopCategories(_req, res, next) {
  try {
    if (!config.features.webshop) {
      return fail(res, 503, 'FEATURE_DISABLED', 'Donate is disabled.');
    }
    return ok(res, { items: shopService.listCategories() });
  } catch (err) {
    return next(err);
  }
}

export async function shopItems(req, res, next) {
  try {
    if (!config.features.webshop) {
      return fail(res, 503, 'FEATURE_DISABLED', 'Donate is disabled.');
    }
    return ok(res, {
      items: shopService.listItems({ categoryId: req.query.categoryId, q: req.query.q }),
    });
  } catch (err) {
    return next(err);
  }
}

export async function shopItem(req, res, next) {
  try {
    return ok(res, { item: shopService.getItem(req.params.id) });
  } catch (err) {
    return next(err);
  }
}

export async function shopPurchase(req, res, next) {
  try {
    const result = await shopService.purchase(req.user.username, req.body.itemId);
    return ok(res, result, result.message);
  } catch (err) {
    return next(err);
  }
}

export async function shopHistory(req, res, next) {
  try {
    return ok(res, { items: shopService.purchaseHistory(req.user.username) });
  } catch (err) {
    return next(err);
  }
}

export async function redeemGift(req, res, next) {
  try {
    const result = await giftCodeService.redeem(req.user.username, req.body.code);
    return ok(res, result, result.message);
  } catch (err) {
    return next(err);
  }
}

export async function voteSites(_req, res, next) {
  try {
    return ok(res, { items: voteService.listSites() });
  } catch (err) {
    return next(err);
  }
}

export async function voteStart(req, res, next) {
  try {
    const result = await voteService.startVote(req.user.username, req.body.siteId, {
      ip: req.ip,
    });
    return ok(res, result, result.message);
  } catch (err) {
    return next(err);
  }
}
