import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, 'cms-local.json');

const defaultStore = {
  news: [
    {
      id: '1',
      type: 'announcement',
      title: 'Welcome to MU Breda Season 21',
      author: 'Staff',
      content:
        'MU Breda Season 21 is online. Register your account, download the client, and join the continent.',
      createdAt: new Date().toISOString(),
      published: true,
    },
    {
      id: '2',
      type: 'update',
      title: 'Season 21 — Official UP',
      author: 'Staff',
      content:
        'The official Season 21 server is live. Create your account and start your adventure on MU Breda.',
      createdAt: new Date().toISOString(),
      published: true,
    },
  ],
  downloads: [
    {
      id: '1',
      title: 'Full Client',
      description: 'Complete Season 21 client package.',
      url: process.env.DOWNLOAD_URL || '',
      size: '—',
      type: 'client',
      order: 1,
    },
    {
      id: '2',
      title: 'Launcher',
      description: 'Official Mu Breda launcher.',
      url: '',
      size: '—',
      type: 'launcher',
      order: 2,
    },
    {
      id: '3',
      title: 'Latest Patch',
      description: 'Required patch for Season 21.',
      url: '',
      size: '—',
      type: 'patch',
      order: 3,
    },
  ],
  giftCodes: [],
  giftRedemptions: [],
  shopCategories: [
    { id: 'weapons', name: 'Weapons', order: 1 },
    { id: 'sets', name: 'Armor Sets', order: 2 },
    { id: 'jewels', name: 'Jewels', order: 3 },
    { id: 'buffs', name: 'Buffs & Consumables', order: 4 },
  ],
  shopItems: [
    {
      id: 'demo-jewel-bless',
      categoryId: 'jewels',
      name: 'Jewel of Bless',
      description: 'Demo catalog item. Delivery disabled until Season 21 item format is verified.',
      image: '',
      price: 10,
      currency: 'credits',
      stock: null,
      options: { level: 0, skill: false, luck: false, excellent: [] },
      enabled: true,
      deliveryEnabled: false,
    },
    {
      id: 'demo-wcoin-pack',
      categoryId: 'buffs',
      name: 'WCoin Pack (Demo)',
      description: 'Demo purchase — credits deducted in mock mode only; no item delivery.',
      image: '',
      price: 50,
      currency: 'credits',
      stock: null,
      options: {},
      enabled: true,
      deliveryEnabled: false,
    },
  ],
  shopPurchases: [],
  voteSites: [],
  voteHistory: [],
  vipTiers: [
    { id: 1, name: 'Bronze', days: 7, price: 100, currency: 'credits' },
    { id: 2, name: 'Silver', days: 30, price: 300, currency: 'credits' },
    { id: 3, name: 'Gold', days: 90, price: 750, currency: 'credits' },
  ],
  auditLogs: [],
  passwordResets: [],
  mockAccounts: {},
};

function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStore, null, 2), 'utf8');
  }
}

export function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return { ...defaultStore, ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultStore);
  }
}

export function writeStore(store) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export function updateStore(mutator) {
  const store = readStore();
  const next = mutator(store) || store;
  writeStore(next);
  return next;
}

export function appendAudit(entry) {
  updateStore((store) => {
    store.auditLogs.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      ...entry,
    });
    store.auditLogs = store.auditLogs.slice(0, 2000);
    return store;
  });
}
