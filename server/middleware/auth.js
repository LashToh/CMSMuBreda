import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { fail } from '../utils/response.js';

export function signToken(payload) {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}

export function setAuthCookie(res, token) {
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true,
    secure: config.auth.cookieSecure,
    sameSite: config.auth.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.auth.cookieName, {
    httpOnly: true,
    secure: config.auth.cookieSecure,
    sameSite: config.auth.cookieSameSite,
    path: '/',
  });
}

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const token = req.cookies?.[config.auth.cookieName] || bearer;
    if (!token) {
      return fail(res, 401, 'UNAUTHORIZED', 'Authentication required.');
    }
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    req.user = {
      username: decoded.username,
      guid: decoded.guid,
      isAdmin: config.adminUsernames.includes(String(decoded.username).toLowerCase()),
    };
    return next();
  } catch {
    return fail(res, 401, 'UNAUTHORIZED', 'Session expired or invalid.');
  }
}

export function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const token = req.cookies?.[config.auth.cookieName] || bearer;
    if (token) {
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      req.user = {
        username: decoded.username,
        guid: decoded.guid,
        isAdmin: config.adminUsernames.includes(String(decoded.username).toLowerCase()),
      };
    }
  } catch {
    /* ignore */
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return fail(res, 403, 'FORBIDDEN', 'Administrator access required.');
  }
  return next();
}
