import * as accountService from '../services/accountService.js';
import { mu } from '../adapters/mu/index.js';
import { ok } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import { config } from '../config/index.js';
import { appendAudit } from '../data/cmsStore.js';

export async function overview(req, res, next) {
  try {
    const data = await accountService.getAccountOverview(req.user.username);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function characters(req, res, next) {
  try {
    const list = await mu.characters.listByAccount(req.user.username);
    return ok(res, { characters: list });
  } catch (err) {
    return next(err);
  }
}

export async function clearPk(req, res, next) {
  try {
    if (!config.features.clearPk) {
      throw new AppError('Clear PK is disabled.', { status: 503, code: 'FEATURE_DISABLED' });
    }
    const { characterName } = req.body;
    const result = await mu.characters.clearPk(req.user.username, characterName);
    appendAudit({
      action: 'tools.clear_pk',
      username: req.user.username,
      meta: { characterName },
    });
    return ok(res, result, 'PK cleared.');
  } catch (err) {
    return next(err);
  }
}

export async function unstuck(req, res, next) {
  try {
    if (!config.features.unstuck) {
      throw new AppError('Unstuck is disabled.', { status: 503, code: 'FEATURE_DISABLED' });
    }
    const { characterName } = req.body;
    const result = await mu.characters.unstuck(req.user.username, characterName);
    appendAudit({
      action: 'tools.unstuck',
      username: req.user.username,
      meta: { characterName },
    });
    return ok(res, result, 'Character moved to safe zone.');
  } catch (err) {
    return next(err);
  }
}

export async function reset(req, res, next) {
  try {
    if (!config.features.reset) {
      throw new AppError('Reset is disabled until Season 21 logic is verified.', {
        status: 503,
        code: 'FEATURE_DISABLED',
      });
    }
    const { characterName } = req.body;
    const result = await mu.characters.reset(req.user.username, characterName);
    appendAudit({ action: 'tools.reset', username: req.user.username, meta: { characterName } });
    return ok(res, result, 'Reset completed.');
  } catch (err) {
    return next(err);
  }
}

export async function grandReset(req, res, next) {
  try {
    if (!config.features.grandReset) {
      throw new AppError('Grand Reset is disabled until compatibility is confirmed.', {
        status: 503,
        code: 'FEATURE_DISABLED',
      });
    }
    const { characterName } = req.body;
    const result = await mu.characters.grandReset(req.user.username, characterName);
    appendAudit({
      action: 'tools.grand_reset',
      username: req.user.username,
      meta: { characterName },
    });
    return ok(res, result, 'Grand Reset completed.');
  } catch (err) {
    return next(err);
  }
}
