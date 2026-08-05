import { config } from '../config/index.js';
import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { mu } from '../adapters/mu/index.js';
import { AppError } from '../utils/errors.js';

/**
 * WebShop architecture.
 * Item delivery is intentionally disabled until Season 21 item encoding is verified.
 * The Item Adapter stub documents the future delivery contract.
 */
export function listCategories() {
  return readStore().shopCategories.sort((a, b) => a.order - b.order);
}

export function listItems({ categoryId, q } = {}) {
  let items = readStore().shopItems.filter((i) => i.enabled);
  if (categoryId) items = items.filter((i) => i.categoryId === categoryId);
  if (q) {
    const needle = String(q).toLowerCase();
    items = items.filter(
      (i) => i.name.toLowerCase().includes(needle) || i.description.toLowerCase().includes(needle),
    );
  }
  return items.map(publicItem);
}

export function getItem(id) {
  const item = readStore().shopItems.find((i) => i.id === id && i.enabled);
  if (!item) throw new AppError('Item not found.', { status: 404, code: 'NOT_FOUND' });
  return publicItem(item);
}

function publicItem(item) {
  return {
    ...item,
    deliveryEnabled: Boolean(
      config.features.webshopDelivery && item.deliveryEnabled && item.deliveryEnabled !== false,
    ),
  };
}

export async function purchase(username, itemId) {
  if (!config.features.webshop) {
    throw new AppError('WebShop is disabled.', { status: 503, code: 'FEATURE_DISABLED' });
  }

  const store = readStore();
  const item = store.shopItems.find((i) => i.id === itemId && i.enabled);
  if (!item) throw new AppError('Item not found.', { status: 404, code: 'NOT_FOUND' });

  const online = await mu.accounts.isOnline(username);
  if (online) {
    throw new AppError('Character must be offline to purchase.', {
      status: 400,
      code: 'ACCOUNT_ONLINE',
    });
  }

  await mu.currency.deduct(username, item.currency, item.price);

  const purchase = {
    id: `${Date.now()}`,
    username,
    itemId: item.id,
    itemName: item.name,
    price: item.price,
    currency: item.currency,
    at: new Date().toISOString(),
    delivered: false,
    deliveryStatus: 'pending_adapter',
  };

  // Delivery intentionally not executed until Item Adapter is verified for Season 21.
  if (config.features.webshopDelivery && item.deliveryEnabled) {
    purchase.deliveryStatus = 'blocked_unverified_item_format';
  } else {
    purchase.deliveryStatus = 'catalog_only_no_delivery';
  }

  updateStore((s) => {
    s.shopPurchases.unshift(purchase);
    return s;
  });

  appendAudit({
    action: 'shop.purchase',
    username,
    meta: { itemId: item.id, price: item.price, currency: item.currency },
  });

  return {
    purchase,
    message:
      'Purchase recorded. Item delivery is disabled until the Season 21 item format is verified.',
    balances: await mu.currency.getBalances(username),
  };
}

export function purchaseHistory(username) {
  return readStore().shopPurchases.filter((p) => p.username.toLowerCase() === username.toLowerCase());
}
