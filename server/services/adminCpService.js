import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { config } from '../config/index.js';
import { writeEnvFile } from '../install/state.js';
import {
  DEFAULT_DONATION_PACKAGES,
  comparePackagesByValue,
  providersForFiat,
} from './donations/packages.js';
import { AppError } from '../utils/errors.js';
import { mu } from '../adapters/mu/index.js';

const FEATURE_KEYS = [
  'webshop',
  'webshopDelivery',
  'reset',
  'grandReset',
  'clearPk',
  'unstuck',
  'vip',
  'giftCodes',
  'voteRewards',
  'news',
  'downloads',
  'rankings',
  'donations',
];

const FEATURE_ENV = {
  webshop: 'ENABLE_WEBSHOP',
  webshopDelivery: 'ENABLE_WEBSHOP_DELIVERY',
  reset: 'ENABLE_RESET',
  grandReset: 'ENABLE_GRAND_RESET',
  clearPk: 'ENABLE_CLEAR_PK',
  unstuck: 'ENABLE_UNSTUCK',
  vip: 'ENABLE_VIP',
  giftCodes: 'ENABLE_GIFT_CODES',
  voteRewards: 'ENABLE_VOTE_REWARDS',
  news: 'ENABLE_NEWS',
  downloads: 'ENABLE_DOWNLOADS',
  rankings: 'ENABLE_RANKINGS',
  donations: 'ENABLE_DONATIONS',
};

export function getCmsSettings() {
  const store = readStore();
  const overrides = store.cmsSettings || {};
  return {
    server: {
      name: overrides.server?.name ?? config.server.name,
      season: overrides.server?.season ?? config.server.season,
      exp: overrides.server?.exp ?? config.server.exp,
      masterExp: overrides.server?.masterExp ?? config.server.masterExp,
      drop: overrides.server?.drop ?? config.server.drop,
      maxLevel: overrides.server?.maxLevel ?? config.server.maxLevel,
      maxMasterLevel: overrides.server?.maxMasterLevel ?? config.server.maxMasterLevel,
      resetLevel: overrides.server?.resetLevel ?? config.server.resetLevel,
      discordUrl: overrides.server?.discordUrl ?? config.server.discordUrl,
      downloadUrl: overrides.server?.downloadUrl ?? config.server.downloadUrl,
      instagramUrl: overrides.server?.instagramUrl ?? config.server.instagramUrl,
      facebookUrl: overrides.server?.facebookUrl ?? config.server.facebookUrl,
    },
    features: {
      ...config.features,
      ...(overrides.features || {}),
    },
    hashMethod: config.hashMethod,
    muDatabaseMode: config.muDatabaseMode,
    adminUsernames: config.adminUsernames,
  };
}

export function saveCmsSettings(payload, adminUsername) {
  const nextServer = payload.server || {};
  const nextFeatures = payload.features || {};

  updateStore((s) => {
    s.cmsSettings = s.cmsSettings || { server: {}, features: {} };
    s.cmsSettings.server = { ...s.cmsSettings.server, ...nextServer };
    s.cmsSettings.features = { ...s.cmsSettings.features, ...nextFeatures };
    return s;
  });

  // Persist feature flags + public server info into .env for restarts
  const envPatch = {};
  if (nextServer.name) envPatch.SERVER_NAME = nextServer.name;
  if (nextServer.season) envPatch.SERVER_SEASON = nextServer.season;
  if (nextServer.exp) envPatch.SERVER_EXP = nextServer.exp;
  if (nextServer.masterExp) envPatch.SERVER_MASTER_EXP = nextServer.masterExp;
  if (nextServer.drop) envPatch.SERVER_DROP = nextServer.drop;
  if (nextServer.maxLevel != null) envPatch.SERVER_MAX_LEVEL = String(nextServer.maxLevel);
  if (nextServer.maxMasterLevel != null) {
    envPatch.SERVER_MAX_MASTER_LEVEL = String(nextServer.maxMasterLevel);
  }
  if (nextServer.discordUrl) envPatch.DISCORD_URL = nextServer.discordUrl;
  if (nextServer.downloadUrl != null) envPatch.DOWNLOAD_URL = nextServer.downloadUrl;

  for (const key of FEATURE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(nextFeatures, key) && FEATURE_ENV[key]) {
      envPatch[FEATURE_ENV[key]] = nextFeatures[key] ? 'true' : 'false';
      // live process update where possible
      if (config.features && key in config.features) {
        config.features[key] = Boolean(nextFeatures[key]);
      }
      if (key === 'donations' && config.features) {
        config.features.donations = Boolean(nextFeatures[key]);
      }
    }
  }

  if (Object.keys(envPatch).length) {
    writeEnvFile(envPatch);
  }

  // Live server info overrides
  Object.assign(config.server, {
    ...(nextServer.name != null ? { name: nextServer.name } : {}),
    ...(nextServer.season != null ? { season: nextServer.season } : {}),
    ...(nextServer.exp != null ? { exp: nextServer.exp } : {}),
    ...(nextServer.masterExp != null ? { masterExp: nextServer.masterExp } : {}),
    ...(nextServer.drop != null ? { drop: nextServer.drop } : {}),
    ...(nextServer.maxLevel != null ? { maxLevel: Number(nextServer.maxLevel) } : {}),
    ...(nextServer.maxMasterLevel != null
      ? { maxMasterLevel: Number(nextServer.maxMasterLevel) }
      : {}),
    ...(nextServer.discordUrl != null ? { discordUrl: nextServer.discordUrl } : {}),
    ...(nextServer.downloadUrl != null ? { downloadUrl: nextServer.downloadUrl } : {}),
  });

  appendAudit({
    action: 'admin.settings.update',
    username: adminUsername,
    meta: { keys: Object.keys(envPatch) },
  });

  return getCmsSettings();
}

export async function searchAccounts(query) {
  const q = String(query || '').trim();
  if (!q || q.length < 2) {
    throw new AppError('Search query must be at least 2 characters.', {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  // Prefer MU adapter lookup by username; fallback email
  let account = await mu.accounts.findByUsername(q);
  if (!account) {
    account = await mu.accounts.findByEmail(q);
  }
  if (!account) {
    return { items: [] };
  }

  let characters = [];
  try {
    characters = await mu.characters.listByAccount(account.username);
  } catch {
    characters = [];
  }

  let balances = {};
  try {
    balances = await mu.currency.getBalances(account.username);
  } catch {
    balances = {};
  }

  return {
    items: [
      {
        username: account.username,
        email: account.email,
        guid: account.guid,
        bloc: account.bloc,
        isAdmin: config.adminUsernames.includes(String(account.username).toLowerCase()),
        characters,
        balances,
      },
    ],
  };
}

export function listDonationPackagesAdmin() {
  const store = readStore();
  const packs =
    Array.isArray(store.donationPackages) && store.donationPackages.length
      ? store.donationPackages
      : DEFAULT_DONATION_PACKAGES;
  return packs
    .map((p) => ({ ...p, providers: providersForFiat(p.fiatCurrency) }))
    .sort(comparePackagesByValue);
}

export function saveDonationPackage(payload, adminUsername) {
  const packs = listDonationPackagesAdmin();
  const id = payload.id || `pack-${Date.now()}`;
  const fiatCurrency = payload.fiatCurrency || 'USD';
  const next = {
    id,
    title: payload.title || 'Pack',
    description: payload.description || '',
    fiatCurrency,
    price: Number(payload.price) || 0,
    creditCurrency: payload.creditCurrency || 'wcoinc',
    creditAmount: Number(payload.creditAmount) || 0,
    providers: providersForFiat(fiatCurrency),
    active: payload.active !== false,
    order: Number(payload.order) || packs.length + 1,
  };

  updateStore((s) => {
    const list =
      Array.isArray(s.donationPackages) && s.donationPackages.length
        ? [...s.donationPackages]
        : [...DEFAULT_DONATION_PACKAGES];
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...next };
    else list.push(next);
    s.donationPackages = list;
    return s;
  });

  appendAudit({
    action: 'admin.donations.package_save',
    username: adminUsername,
    meta: { id },
  });

  return listDonationPackagesAdmin().find((p) => p.id === id);
}

export function deleteDonationPackage(id, adminUsername) {
  let found = false;
  updateStore((s) => {
    const list =
      Array.isArray(s.donationPackages) && s.donationPackages.length
        ? [...s.donationPackages]
        : [...DEFAULT_DONATION_PACKAGES];
    const next = list.filter((p) => p.id !== id);
    found = next.length < list.length;
    s.donationPackages = next;
    return s;
  });
  if (!found) {
    throw new AppError('Donation package not found.', { status: 404, code: 'NOT_FOUND' });
  }
  appendAudit({
    action: 'admin.donations.package_delete',
    username: adminUsername,
    meta: { id },
  });
  return { deleted: true };
}
