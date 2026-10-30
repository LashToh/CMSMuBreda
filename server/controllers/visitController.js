import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { ok } from '../utils/response.js';
import { getVisitReport, recordVisit } from '../services/visitService.js';

const VISITOR_COOKIE = 'mubreda_vid';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveVisitorId(req, res) {
  const cookieId = req.cookies?.[VISITOR_COOKIE];
  if (typeof cookieId === 'string' && UUID_RE.test(cookieId)) return cookieId;

  const bodyId = req.body?.visitorId;
  const id = typeof bodyId === 'string' && UUID_RE.test(bodyId) ? bodyId : crypto.randomUUID();
  const options = {
    httpOnly: true,
    secure: config.auth.cookieSecure,
    sameSite: config.auth.cookieSameSite || 'lax',
    maxAge: 400 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  if (config.auth.cookieDomain) options.domain = config.auth.cookieDomain;
  res.cookie(VISITOR_COOKIE, id, options);
  return id;
}

export function track(req, res, next) {
  try {
    const visitorId = resolveVisitorId(req, res);
    const result = recordVisit({ path: req.body?.path, visitorId });
    return ok(res, { recorded: Boolean(result.recorded) });
  } catch (err) {
    return next(err);
  }
}

export function report(req, res, next) {
  try {
    return ok(res, getVisitReport(req.query.days));
  } catch (err) {
    return next(err);
  }
}
