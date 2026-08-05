import { config } from '../config/index.js';
import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { mu } from '../adapters/mu/index.js';
import { AppError } from '../utils/errors.js';

export async function redeem(username, code) {
  if (!config.features.giftCodes) {
    throw new AppError('Gift Codes are disabled.', { status: 503, code: 'FEATURE_DISABLED' });
  }

  const normalized = String(code || '')
    .trim()
    .toUpperCase();
  if (!normalized) {
    throw new AppError('Gift code is required.', { status: 400, code: 'VALIDATION_ERROR' });
  }

  const store = readStore();
  const gift = store.giftCodes.find((g) => g.code === normalized && g.active !== false);
  if (!gift) {
    throw new AppError('Invalid gift code.', { status: 404, code: 'INVALID_CODE' });
  }

  if (gift.expiresAt && new Date(gift.expiresAt) < new Date()) {
    throw new AppError('This gift code has expired.', { status: 400, code: 'CODE_EXPIRED' });
  }

  if (gift.maxUses != null && gift.uses >= gift.maxUses) {
    throw new AppError('This gift code has reached its maximum uses.', {
      status: 400,
      code: 'CODE_EXHAUSTED',
    });
  }

  const already = store.giftRedemptions.some(
    (r) => r.code === normalized && r.username.toLowerCase() === username.toLowerCase(),
  );
  if (already) {
    throw new AppError('You have already redeemed this code.', {
      status: 400,
      code: 'ALREADY_REDEEMED',
    });
  }

  // Transactional intent: deduct/credit then log; rollback via not writing on failure
  if (['credits', 'wcoinc', 'wcoinp', 'goblin'].includes(gift.rewardType)) {
    await mu.currency.add(username, gift.rewardType, Number(gift.rewardAmount) || 0);
  } else {
    throw new AppError('Unsupported reward type for this code.', {
      status: 400,
      code: 'UNSUPPORTED_REWARD',
    });
  }

  updateStore((s) => {
    const g = s.giftCodes.find((x) => x.code === normalized);
    if (g) g.uses = (g.uses || 0) + 1;
    s.giftRedemptions.unshift({
      id: `${Date.now()}`,
      code: normalized,
      username,
      rewardType: gift.rewardType,
      rewardAmount: gift.rewardAmount,
      at: new Date().toISOString(),
    });
    return s;
  });

  appendAudit({
    action: 'giftcode.redeem',
    username,
    meta: { code: normalized, rewardType: gift.rewardType, rewardAmount: gift.rewardAmount },
  });

  return {
    message: 'Gift code redeemed successfully.',
    reward: { type: gift.rewardType, amount: gift.rewardAmount },
    balances: await mu.currency.getBalances(username),
  };
}

export function listCodesAdmin() {
  return readStore().giftCodes;
}

export function createCodeAdmin(payload) {
  const code = String(payload.code || '')
    .trim()
    .toUpperCase();
  if (!code) throw new AppError('Code is required.', { status: 400, code: 'VALIDATION_ERROR' });

  updateStore((s) => {
    if (s.giftCodes.some((g) => g.code === code)) {
      throw new AppError('Code already exists.', { status: 409, code: 'CODE_EXISTS' });
    }
    s.giftCodes.push({
      code,
      rewardType: payload.rewardType || 'credits',
      rewardAmount: Number(payload.rewardAmount) || 0,
      maxUses: payload.maxUses ?? 1,
      uses: 0,
      expiresAt: payload.expiresAt || null,
      active: true,
      createdAt: new Date().toISOString(),
    });
    return s;
  });

  appendAudit({ action: 'admin.giftcode.create', username: payload.adminUsername, meta: { code } });
  return readStore().giftCodes.find((g) => g.code === code);
}
