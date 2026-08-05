/**
 * Season 21 class mapping (configurable).
 * Includes Crusader and other modern classes.
 * IDs may differ by emulator — override via server/config/classes.override.json if needed.
 */
export const CLASS_MAP = {
  0: { id: 0, name: 'Dark Wizard', short: 'DW', group: 0 },
  1: { id: 1, name: 'Soul Master', short: 'SM', group: 0 },
  2: { id: 2, name: 'Grand Master', short: 'GM', group: 0 },
  3: { id: 3, name: 'Soul Wizard', short: 'SW', group: 0 },
  7: { id: 7, name: 'Dark Knight', short: 'DK', group: 7 },
  8: { id: 8, name: 'Blade Knight', short: 'BK', group: 7 },
  9: { id: 9, name: 'Blade Master', short: 'BM', group: 7 },
  10: { id: 10, name: 'Dragon Knight', short: 'DGK', group: 7 },
  14: { id: 14, name: 'Fairy Elf', short: 'FE', group: 14 },
  15: { id: 15, name: 'Muse Elf', short: 'ME', group: 14 },
  16: { id: 16, name: 'High Elf', short: 'HE', group: 14 },
  17: { id: 17, name: 'Noble Elf', short: 'NE', group: 14 },
  21: { id: 21, name: 'Magic Gladiator', short: 'MG', group: 21 },
  22: { id: 22, name: 'Duel Master', short: 'DM', group: 21 },
  23: { id: 23, name: 'Magic Knight', short: 'MK', group: 21 },
  28: { id: 28, name: 'Dark Lord', short: 'DL', group: 28 },
  29: { id: 29, name: 'Lord Emperor', short: 'LE', group: 28 },
  30: { id: 30, name: 'Empire Lord', short: 'EL', group: 28 },
  35: { id: 35, name: 'Summoner', short: 'SUM', group: 35 },
  36: { id: 36, name: 'Bloody Summoner', short: 'BS', group: 35 },
  37: { id: 37, name: 'Dimension Master', short: 'DSM', group: 35 },
  38: { id: 38, name: 'Dimension Summoner', short: 'DS', group: 35 },
  42: { id: 42, name: 'Rage Fighter', short: 'RF', group: 42 },
  43: { id: 43, name: 'Fist Master', short: 'FM', group: 42 },
  44: { id: 44, name: 'Fist Blazer', short: 'FB', group: 42 },
  49: { id: 49, name: 'Grow Lancer', short: 'GL', group: 49 },
  50: { id: 50, name: 'Mirage Lancer', short: 'ML', group: 49 },
  51: { id: 51, name: 'Shining Lancer', short: 'SL', group: 49 },
  56: { id: 56, name: 'Rune Wizard', short: 'RW', group: 56 },
  57: { id: 57, name: 'Rune Spell Master', short: 'RSM', group: 56 },
  58: { id: 58, name: 'Grand Rune Master', short: 'GRM', group: 56 },
  63: { id: 63, name: 'Slayer', short: 'SLY', group: 63 },
  64: { id: 64, name: 'Royal Slayer', short: 'RSL', group: 63 },
  65: { id: 65, name: 'Master Slayer', short: 'MSL', group: 63 },
  70: { id: 70, name: 'Gun Crusher', short: 'GC', group: 70 },
  71: { id: 71, name: 'Gun Breaker', short: 'GB', group: 70 },
  72: { id: 72, name: 'Master Gun Breaker', short: 'MGB', group: 70 },
  77: { id: 77, name: 'Light Wizard', short: 'LW', group: 77 },
  78: { id: 78, name: 'Light Master', short: 'LM', group: 77 },
  79: { id: 79, name: 'Shine Wizard', short: 'SHW', group: 77 },
  84: { id: 84, name: 'Lemuria Mage', short: 'LEM', group: 84 },
  85: { id: 85, name: 'Warmage', short: 'WM', group: 84 },
  86: { id: 86, name: 'Archmage', short: 'AM', group: 84 },
  91: { id: 91, name: 'Illusion Knight', short: 'IK', group: 91 },
  92: { id: 92, name: 'Mirage Knight', short: 'MIK', group: 91 },
  93: { id: 93, name: 'Illusion Master', short: 'IM', group: 91 },
  98: { id: 98, name: 'Alchemist', short: 'ALC', group: 98 },
  99: { id: 99, name: 'Alchemist Master', short: 'ALM', group: 98 },
  100: { id: 100, name: 'Alchemist Grand Master', short: 'AGM', group: 98 },
  // Season 21 — Crusader (Allen). IDs are placeholders until DB/class.dat is verified.
  105: { id: 105, name: 'Crusader', short: 'CRU', group: 105 },
  106: { id: 106, name: 'Paladin Crusader', short: 'PCR', group: 105 },
  107: { id: 107, name: 'Temple Crusader', short: 'TCR', group: 105 },
};

export function resolveClass(classId) {
  const id = Number(classId);
  return (
    CLASS_MAP[id] || {
      id,
      name: `Class ${id}`,
      short: `C${id}`,
      group: id,
      unknown: true,
    }
  );
}
