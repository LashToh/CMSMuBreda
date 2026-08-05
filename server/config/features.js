function flag(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

/**
 * Feature flags. Potentially dangerous / schema-dependent modules default OFF.
 * WebShop UI can be on while delivery stays off until Season 21 item format is verified.
 */
export const featureFlags = {
  webshop: flag('ENABLE_WEBSHOP', true),
  webshopDelivery: flag('ENABLE_WEBSHOP_DELIVERY', false),
  reset: flag('ENABLE_RESET', false),
  grandReset: flag('ENABLE_GRAND_RESET', false),
  clearPk: flag('ENABLE_CLEAR_PK', false),
  unstuck: flag('ENABLE_UNSTUCK', false),
  vip: flag('ENABLE_VIP', false),
  giftCodes: flag('ENABLE_GIFT_CODES', true),
  voteRewards: flag('ENABLE_VOTE_REWARDS', false),
  news: flag('ENABLE_NEWS', true),
  downloads: flag('ENABLE_DOWNLOADS', true),
  rankings: flag('ENABLE_RANKINGS', true),
  donations: flag('ENABLE_DONATIONS', true),
};
