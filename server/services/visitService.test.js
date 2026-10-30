import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  flushVisits,
  getVisitReport,
  normalizePublicPath,
  recordVisit,
  useVisitStore,
} from './visitService.js';

const storeFile = path.join(os.tmpdir(), `mubreda-visits-${process.pid}.json`);

beforeEach(() => {
  fs.rmSync(storeFile, { force: true });
  fs.rmSync(`${storeFile}.tmp`, { force: true });
  useVisitStore(storeFile);
});

after(async () => {
  await flushVisits();
  fs.rmSync(storeFile, { force: true });
  fs.rmSync(`${storeFile}.tmp`, { force: true });
  useVisitStore(null);
});

test('ignores admin, static assets, and the launcher update API', () => {
  assert.equal(normalizePublicPath('/news'), '/news');
  assert.equal(normalizePublicPath('/donate?x=1'), '/donate');
  assert.equal(normalizePublicPath('/'), '/');
  for (const skipped of [
    '/admin',
    '/admin/settings',
    '/install',
    '/api/launcher/manifest',
    '/api/launcher/files/1.0.1/Data/item.bmd',
    '/patches/1.0.1/Data/item.bmd',
    '/launcher/manifest',
    '/assets/logo-mubreda.webp',
    '/favicon.ico',
    '/shop',
    '/info',
  ]) {
    assert.equal(normalizePublicPath(skipped), null, skipped);
  }
});

test('counts daily visits, uniques, and top pages', async () => {
  const day = new Date('2026-10-30T15:00:00.000Z');
  const later = new Date('2026-10-30T15:00:05.000Z');
  recordVisit({ path: '/news', visitorId: '11111111-1111-4111-8111-111111111111', now: day });
  recordVisit({ path: '/', visitorId: '11111111-1111-4111-8111-111111111111', now: later });
  recordVisit({ path: '/news', visitorId: '22222222-2222-4222-8222-222222222222', now: later });
  recordVisit({ path: '/admin', visitorId: '22222222-2222-4222-8222-222222222222', now: later });
  recordVisit({
    path: '/api/launcher/manifest',
    visitorId: '33333333-3333-4333-8333-333333333333',
    now: later,
  });
  await flushVisits();

  const report = getVisitReport(14, day);
  assert.equal(report.rangeDays, 14);
  assert.equal(report.totalVisits, 3);
  assert.equal(report.uniqueVisitors, 2);
  assert.equal(report.today.visits, 3);
  assert.equal(report.today.uniques, 2);
  assert.equal(report.days.length, 14);
  assert.deepEqual(report.topPages, [
    { path: '/news', visits: 2 },
    { path: '/', visits: 1 },
  ]);
  assert.equal(JSON.stringify(report).includes('11111111'), false);
});

test('same visitor and page inside the dedupe window counts once', async () => {
  const now = new Date('2026-10-30T12:00:00.000Z');
  const first = recordVisit({
    path: '/',
    visitorId: '11111111-1111-4111-8111-111111111111',
    now,
  });
  const second = recordVisit({
    path: '/',
    visitorId: '11111111-1111-4111-8111-111111111111',
    now: new Date(now.getTime() + 500),
  });
  assert.equal(first.recorded, true);
  assert.equal(second.recorded, false);
  assert.equal(getVisitReport(14, now).totalVisits, 1);
  await flushVisits();
});
