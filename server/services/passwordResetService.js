import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { mu } from '../adapters/mu/index.js';
import { AppError } from '../utils/errors.js';
import { appendAudit, readStore, updateStore } from '../data/cmsStore.js';

/**
 * Forgot-password architecture.
 * Tokens are stored in the local CMS store (not MEMB_INFO).
 * Email delivery is intentionally not wired — integrate SMTP later.
 * Never emails or returns the raw password.
 */

function ensureResetBucket(store) {
  if (!store.passwordResets) store.passwordResets = [];
  return store;
}

export async function requestReset(email) {
  const account = await mu.accounts.findByEmail(email);
  // Always return the same message to avoid account enumeration
  const publicMessage =
    'If that email is registered, a password reset link will be sent when email delivery is configured.';

  if (!account) {
    return { message: publicMessage, queued: false };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  updateStore((s) => {
    ensureResetBucket(s);
    s.passwordResets = s.passwordResets.filter(
      (r) => r.username.toLowerCase() !== account.username.toLowerCase(),
    );
    s.passwordResets.push({
      username: account.username,
      email: account.email,
      tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    });
    return s;
  });

  appendAudit({
    action: 'account.password_reset_request',
    username: account.username,
    meta: { email: account.email },
  });

  // Dev/mock only: expose token so local testing works without SMTP
  const payload = { message: publicMessage, queued: true };
  if (!config.isProduction && config.isMock) {
    payload.devToken = token;
  }
  return payload;
}

export async function confirmReset({ token, newPassword }) {
  if (!token || !newPassword) {
    throw new AppError('Token and new password are required.', {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const store = readStore();
  ensureResetBucket(store);
  const entry = store.passwordResets.find((r) => r.tokenHash === tokenHash && !r.used);

  if (!entry) {
    throw new AppError('Invalid or expired reset token.', { status: 400, code: 'INVALID_TOKEN' });
  }
  if (new Date(entry.expiresAt) < new Date()) {
    throw new AppError('Invalid or expired reset token.', { status: 400, code: 'INVALID_TOKEN' });
  }

  await mu.accounts.changePassword(entry.username, newPassword);

  updateStore((s) => {
    ensureResetBucket(s);
    const row = s.passwordResets.find((r) => r.tokenHash === tokenHash);
    if (row) row.used = true;
    return s;
  });

  appendAudit({ action: 'account.password_reset_confirm', username: entry.username });
  return { message: 'Password has been reset. You can now log in.' };
}
