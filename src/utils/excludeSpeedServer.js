/**
 * Speed Server exclusion filter for Season 21 landing page.
 * Strips Speed Server–only content from data exports (events, bonuses, rates, CTAs).
 * Source pages may mix Crusader info with Speed Server tabs — this keeps permanent S21 content only.
 */

const SPEED_SERVER_PATTERNS = [
  /speed\s*server/i,
  /servidor\s*(de\s*)?speed/i,
  /servidor\s*r[aá]pido/i,
  /speedserver/i,
  /fast\s*track/i,
  /speed\s*server\s*transfer/i,
  /speed\s*server\s*exclusive/i,
  /speed\s*server\s*reborn/i,
  /speed\s*server\s*plus/i,
  /speedy\s*level\s*up/i,
  /level\s*cap\s*expansion[\s\S]{0,40}900/i,
  /\blv\.?\s*900\b/i,
  /800\s*(?:→|->|—|-)\s*900/,
  /exp\s*rate/i,
  /bonus\s*rate/i,
  /pre-register/i,
  /special\s*sales/i,
  /ventas\s*especiales/i,
  /beneficios\s*del\s*speed/i,
  /misiones\s*del\s*servidor/i,
  /periodo\s*de\s*evento/i,
  /event\s*period[\s\S]{0,30}2026\.07\.21/i,
];

/** Returns true if text matches Speed Server–only content. */
export function isSpeedServerContent(text) {
  if (text == null || typeof text !== 'string') return false;
  return SPEED_SERVER_PATTERNS.some((re) => re.test(text));
}

/** Remove list items whose serialized content matches Speed Server patterns. */
export function excludeSpeedServerItems(items) {
  if (!Array.isArray(items)) return items;
  return items.filter((item) => !isSpeedServerContent(JSON.stringify(item)));
}

/** Strip Speed Server phrases from a string (returns empty string if fully SS-only). */
export function sanitizeText(text) {
  if (text == null || typeof text !== 'string') return text;
  if (isSpeedServerContent(text)) return '';
  return text;
}
