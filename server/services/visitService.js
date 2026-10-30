import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Daily public-page analytics.
 * Stored in server/data/visits.json, same local CMS file pattern as cms-local.json.
 * This project does not migrate the MU SQL schema, so visits are not a game-database table.
 * Admin, static assets, install, and the launcher update API are never recorded.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STORE = path.join(__dirname, '../data/visits.json');

const PUBLIC_PAGES = new Set([
  '/',
  '/login',
  '/register',
  '/account',
  '/rankings',
  '/news',
  '/downloads',
  '/donate',
  '/about',
]);

const BLOCKED_PREFIXES = ['/admin', '/api', '/install', '/patches', '/launcher', '/assets'];

const RETENTION_DAYS = 90;
const MIN_RANGE_DAYS = 14;
const MAX_RANGE_DAYS = 90;
const MAX_UNIQUES_PER_DAY = 20000;
const DEDUPE_MS = 2000;
const TOP_PAGES = 10;

let storePath = DEFAULT_STORE;
let state = null;
let chain = Promise.resolve();
const recent = new Map();

export function useVisitStore(filePath) {
  storePath = filePath || DEFAULT_STORE;
  state = null;
  recent.clear();
  chain = Promise.resolve();
}

function utcDay(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(day, amount) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function emptyState() {
  return { days: {} };
}

function load() {
  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.days || typeof parsed.days !== 'object') {
      return emptyState();
    }
    return { days: parsed.days };
  } catch (err) {
    if (err?.code === 'ENOENT') return emptyState();
    console.error('[visits] unreadable store, starting fresh');
    return emptyState();
  }
}

function getState() {
  if (!state) state = load();
  return state;
}

function persist(snapshot, file) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(snapshot));
  fs.renameSync(tmp, file);
}

function scheduleFlush() {
  const snapshot = getState();
  const file = storePath;
  chain = chain.then(() => {
    try {
      persist(snapshot, file);
    } catch (err) {
      console.error('[visits] save failed', err.message);
    }
  });
}

export function flushVisits() {
  const snapshot = state;
  const file = storePath;
  chain = chain.then(() => {
    if (!snapshot) return;
    try {
      persist(snapshot, file);
    } catch (err) {
      console.error('[visits] save failed', err.message);
    }
  });
  return chain;
}

function prune(snapshot, today) {
  const cutoff = addDays(today, -(RETENTION_DAYS - 1));
  for (const day of Object.keys(snapshot.days)) {
    if (day < cutoff) delete snapshot.days[day];
  }
}

function seenRecently(key, nowMs) {
  const prev = recent.get(key);
  if (prev != null && nowMs - prev < DEDUPE_MS) return true;
  recent.set(key, nowMs);
  if (recent.size > 8000) {
    for (const [entry, at] of recent) {
      if (nowMs - at >= DEDUPE_MS) recent.delete(entry);
    }
  }
  return false;
}

/**
 * @returns {string|null} canonical public path, or null when the hit must be ignored
 */
export function normalizePublicPath(input) {
  if (typeof input !== 'string') return null;
  let raw = input.trim();
  if (!raw || raw.includes('://') || raw.includes('\\') || raw.includes('..')) return null;
  const hash = raw.indexOf('#');
  if (hash >= 0) raw = raw.slice(0, hash);
  const query = raw.indexOf('?');
  if (query >= 0) raw = raw.slice(0, query);
  if (!raw.startsWith('/') || raw.length > 180 || raw.includes('//')) return null;
  let page = raw;
  if (page.length > 1 && page.endsWith('/')) page = page.slice(0, -1);
  const lower = page.toLowerCase();
  if (BLOCKED_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(`${prefix}/`))) {
    return null;
  }
  if (/\.[a-z0-9]{1,8}$/i.test(lower)) return null;
  if (!PUBLIC_PAGES.has(lower)) return null;
  return lower;
}

export function hashVisitor(visitorId) {
  return crypto.createHash('sha256').update(String(visitorId)).digest('hex').slice(0, 32);
}

/**
 * Record one public page view. Same visitor + path inside 2s counts once
 * (covers the dev double-mount without hiding a later refresh).
 */
export function recordVisit({ path: pagePath, visitorId, now = new Date() }) {
  const page = normalizePublicPath(pagePath);
  if (!page || !visitorId) return { recorded: false };

  const nowMs = now.getTime();
  const hash = hashVisitor(visitorId);
  if (seenRecently(`${hash}|${page}`, nowMs)) return { recorded: false, duplicate: true };

  const day = utcDay(now);
  const snapshot = getState();
  prune(snapshot, day);
  const bucket = snapshot.days[day] || { visits: 0, visitors: [], pages: {} };
  bucket.visits += 1;
  if (!bucket.visitors.includes(hash) && bucket.visitors.length < MAX_UNIQUES_PER_DAY) {
    bucket.visitors.push(hash);
  }
  bucket.pages[page] = (bucket.pages[page] || 0) + 1;
  snapshot.days[day] = bucket;
  scheduleFlush();
  return { recorded: true, path: page, day };
}

function clampRange(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return MIN_RANGE_DAYS;
  return Math.min(MAX_RANGE_DAYS, Math.max(MIN_RANGE_DAYS, Math.floor(n)));
}

export function getVisitReport(days = MIN_RANGE_DAYS, now = new Date()) {
  const rangeDays = clampRange(days);
  const today = utcDay(now);
  const snapshot = getState();
  const dayKeys = [];
  for (let i = rangeDays - 1; i >= 0; i -= 1) dayKeys.push(addDays(today, -i));

  const unique = new Set();
  const pageTotals = new Map();
  let totalVisits = 0;
  const rows = dayKeys.map((day) => {
    const bucket = snapshot.days[day];
    const visits = bucket?.visits || 0;
    const visitors = Array.isArray(bucket?.visitors) ? bucket.visitors : [];
    totalVisits += visits;
    for (const id of visitors) unique.add(id);
    if (bucket?.pages) {
      for (const [page, count] of Object.entries(bucket.pages)) {
        pageTotals.set(page, (pageTotals.get(page) || 0) + count);
      }
    }
    return { date: day, visits, uniques: visitors.length };
  });

  const todayRow = rows[rows.length - 1] || { date: today, visits: 0, uniques: 0 };
  const topPages = [...pageTotals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_PAGES)
    .map(([page, visits]) => ({ path: page, visits }));

  return {
    rangeDays,
    timezone: 'UTC',
    from: dayKeys[0],
    to: today,
    totalVisits,
    uniqueVisitors: unique.size,
    today: { date: todayRow.date, visits: todayRow.visits, uniques: todayRow.uniques },
    days: [...rows].reverse(),
    topPages,
  };
}
