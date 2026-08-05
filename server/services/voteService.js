import { config } from '../config/index.js';
import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { mu } from '../adapters/mu/index.js';
import { AppError } from '../utils/errors.js';

/**
 * Vote rewards architecture.
 * Provider verification is modular — do not fake external vote confirmation.
 */
export function listSites() {
  if (!config.features.voteRewards) return [];
  return readStore().voteSites.map((s) => ({
    id: s.id,
    title: s.title,
    link: s.link,
    reward: s.reward,
    currency: s.currency || 'credits',
    cooldownHours: s.cooldownHours || 12,
  }));
}

export async function startVote(username, siteId, { ip } = {}) {
  if (!config.features.voteRewards) {
    throw new AppError('Vote rewards are disabled.', { status: 503, code: 'FEATURE_DISABLED' });
  }

  const site = readStore().voteSites.find((s) => s.id === siteId);
  if (!site) throw new AppError('Vote site not found.', { status: 404, code: 'NOT_FOUND' });

  const cooldownMs = (site.cooldownHours || 12) * 3600 * 1000;
  const history = readStore().voteHistory.filter(
    (h) =>
      h.siteId === siteId &&
      (h.username.toLowerCase() === username.toLowerCase() || (ip && h.ip === ip)),
  );
  const last = history[0];
  if (last && Date.now() - new Date(last.at).getTime() < cooldownMs) {
    throw new AppError('Vote cooldown active.', { status: 429, code: 'COOLDOWN' });
  }

  // Modular provider hook — without a real callback, we only record intent + redirect.
  // Credits are NOT granted until a verified provider callback confirms the vote.
  updateStore((s) => {
    s.voteHistory.unshift({
      id: `${Date.now()}`,
      username,
      siteId,
      ip: ip || null,
      at: new Date().toISOString(),
      status: 'pending_provider',
      rewarded: false,
    });
    return s;
  });

  appendAudit({
    action: 'vote.start',
    username,
    meta: { siteId, status: 'pending_provider' },
  });

  return {
    redirectUrl: site.link,
    message:
      'Redirecting to vote site. Rewards are granted only after provider verification (not faked).',
    balances: await mu.currency.getBalances(username),
  };
}
