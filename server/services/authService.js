import { mu } from '../adapters/mu/index.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import { appendAudit } from '../data/cmsStore.js';
import { config } from '../config/index.js';

export async function registerAccount(input) {
  const existing = await mu.accounts.findByUsername(input.username);
  if (existing) {
    throw new AppError('Username is already taken.', { status: 409, code: 'USERNAME_TAKEN' });
  }

  if (!config.registration.allowDuplicateEmails) {
    const emailHit = await mu.accounts.findByEmail(input.email);
    if (emailHit) {
      throw new AppError('Email address is already registered.', {
        status: 409,
        code: 'EMAIL_TAKEN',
      });
    }
  }

  await mu.accounts.create({
    username: input.username,
    password: input.password,
    email: input.email,
  });

  appendAudit({
    action: 'account.register',
    username: input.username,
    meta: { email: input.email },
  });

  return {
    message: 'Account registered successfully. You can now log in.',
    username: input.username,
  };
}

export async function login(input, res) {
  const account = await mu.accounts.findByUsername(input.username);
  if (!account) {
    throw new AppError('Invalid username or password.', { status: 401, code: 'INVALID_CREDENTIALS' });
  }

  if (Number(account.bloc) === 1) {
    throw new AppError('This account is banned.', { status: 403, code: 'ACCOUNT_BANNED' });
  }

  const valid = await mu.accounts.validatePassword(input.username, input.password);
  if (!valid) {
    throw new AppError('Invalid username or password.', { status: 401, code: 'INVALID_CREDENTIALS' });
  }

  const isAdmin = config.adminUsernames.includes(String(account.username).toLowerCase());
  const token = signToken({
    username: account.username,
    guid: account.guid,
    isAdmin,
  });
  setAuthCookie(res, token);

  appendAudit({ action: 'account.login', username: account.username });

  return {
    token,
    user: {
      username: account.username,
      email: account.email,
      guid: account.guid,
      isAdmin,
    },
  };
}

export function logout(res) {
  clearAuthCookie(res);
  return { message: 'Logged out.' };
}

export async function getCurrentUser(username) {
  const account = await mu.accounts.findByUsername(username);
  if (!account) {
    throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
  }
  return {
    username: account.username,
    email: account.email,
    guid: account.guid,
    isAdmin: config.adminUsernames.includes(String(account.username).toLowerCase()),
  };
}

export async function changePassword(username, input) {
  const valid = await mu.accounts.validatePassword(username, input.currentPassword);
  if (!valid) {
    throw new AppError('Current password is incorrect.', {
      status: 400,
      code: 'INVALID_PASSWORD',
    });
  }
  await mu.accounts.changePassword(username, input.newPassword);
  appendAudit({ action: 'account.change_password', username });
  return { message: 'Password changed successfully.' };
}

export async function changeEmail(username, input) {
  const valid = await mu.accounts.validatePassword(username, input.currentPassword);
  if (!valid) {
    throw new AppError('Current password is incorrect.', {
      status: 400,
      code: 'INVALID_PASSWORD',
    });
  }

  const account = await mu.accounts.findByUsername(username);
  if (!account) {
    throw new AppError('Account not found.', { status: 404, code: 'NOT_FOUND' });
  }

  const next = String(input.newEmail).trim().toLowerCase();
  if (String(account.email || '').toLowerCase() === next) {
    throw new AppError('That is already your email address.', {
      status: 400,
      code: 'EMAIL_UNCHANGED',
    });
  }

  await mu.accounts.changeEmail(username, next);
  appendAudit({
    action: 'account.change_email',
    username,
    meta: { email: next },
  });
  return { message: 'Email changed successfully.', email: next };
}
