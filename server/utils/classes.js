/**
 * MuDevs Season 21 Character.Class mapping.
 * DB value = baseClass * 16 + changeUp (see DefaultClassInfo.txt).
 */
const FAMILIES = [
  {
    group: 0,
    short: 'DW',
    stages: ['Dark Wizard', 'Soul Master', 'Grand Master', 'Soul Wizard', 'Mystic Wizard'],
  },
  {
    group: 1,
    short: 'DK',
    stages: ['Dark Knight', 'Blade Knight', 'Blade Master', 'Dragon Knight', 'Glorious Knight'],
  },
  {
    group: 2,
    short: 'FE',
    stages: ['Fairy Elf', 'Muse Elf', 'High Elf', 'Noble Elf', 'Royal Elf'],
  },
  {
    group: 3,
    short: 'MG',
    stages: ['Magic Gladiator', 'Duel Master', 'Duel Master', 'Magic Knight', 'Magic Knight'],
  },
  {
    group: 4,
    short: 'DL',
    stages: ['Dark Lord', 'Lord Emperor', 'Lord Emperor', 'Empire Lord', 'Empire Lord'],
  },
  {
    group: 5,
    short: 'SU',
    stages: ['Summoner', 'Bloody Summoner', 'Dimension Master', 'Dimension Summoner', 'Dimension Summoner'],
  },
  {
    group: 6,
    short: 'RF',
    stages: ['Rage Fighter', 'Fist Master', 'Fist Master', 'Fist Blazer', 'Fist Blazer'],
  },
  {
    group: 7,
    short: 'GL',
    stages: ['Grow Lancer', 'Mirage Lancer', 'Mirage Lancer', 'Shining Lancer', 'Shining Lancer'],
  },
  {
    group: 8,
    short: 'RW',
    stages: ['Rune Wizard', 'Rune Spell Master', 'Grand Rune Master', 'Majestic Rune Wizard', 'Majestic Rune Wizard'],
  },
  {
    group: 9,
    short: 'SLY',
    stages: ['Slayer', 'Royal Slayer', 'Master Slayer', 'Slaughterer', 'Slaughterer'],
  },
  {
    group: 10,
    short: 'GC',
    stages: ['Gun Crusher', 'Gun Breaker', 'Master Gun Breaker', 'Heist Gun Crusher', 'Heist Gun Crusher'],
  },
  {
    group: 11,
    short: 'LW',
    stages: ['Light Wizard', 'Light Master', 'Shine Wizard', 'Luminous Wizard', 'Luminous Wizard'],
  },
  {
    group: 12,
    short: 'LM',
    stages: ['Lemuria Mage', 'Warmage', 'Archmage', 'Mystic Mage', 'Mystic Mage'],
  },
  {
    group: 13,
    short: 'IK',
    stages: ['Illusion Knight', 'Mirage Knight', 'Illusion Master', 'Mystic Knight', 'Mystic Knight'],
  },
  {
    group: 14,
    short: 'ALC',
    stages: ['Alchemist', 'Alchemist Adept', 'Alchemist Master', 'Alchemist Grand Master', 'Alchemist Grand Master'],
  },
  {
    group: 15,
    short: 'CRU',
    stages: ['Crusader', 'Paladin Crusader', 'Temple Crusader', 'Holy Crusader', 'Holy Crusader'],
  },
];

/** Explicit overrides for MuDevs quirks (skipped changeUp slots, alternate IDs). */
const EXPLICIT = {
  // Magic Gladiator line (common MuDevs layout)
  48: { name: 'Magic Gladiator', short: 'MG', group: 3 },
  50: { name: 'Duel Master', short: 'DM', group: 3 },
  51: { name: 'Magic Knight', short: 'MK', group: 3 },
  52: { name: 'Magic Knight', short: 'MK', group: 3 },
  // Dark Lord
  64: { name: 'Dark Lord', short: 'DL', group: 4 },
  66: { name: 'Lord Emperor', short: 'LE', group: 4 },
  67: { name: 'Empire Lord', short: 'EL', group: 4 },
  68: { name: 'Empire Lord', short: 'EL', group: 4 },
  // Rage Fighter
  96: { name: 'Rage Fighter', short: 'RF', group: 6 },
  98: { name: 'Fist Master', short: 'FM', group: 6 },
  99: { name: 'Fist Blazer', short: 'FB', group: 6 },
  100: { name: 'Fist Blazer', short: 'FB', group: 6 },
  // Grow Lancer
  112: { name: 'Grow Lancer', short: 'GL', group: 7 },
  114: { name: 'Mirage Lancer', short: 'ML', group: 7 },
  115: { name: 'Shining Lancer', short: 'SL', group: 7 },
  116: { name: 'Shining Lancer', short: 'SL', group: 7 },
};

function buildClassMap() {
  const map = { ...EXPLICIT };
  for (const fam of FAMILIES) {
    for (let stage = 0; stage < fam.stages.length; stage++) {
      const id = fam.group * 16 + stage;
      if (map[id]) continue;
      map[id] = {
        id,
        name: fam.stages[stage],
        short: fam.short,
        group: fam.group,
      };
    }
  }
  // Ensure id field on explicit entries
  for (const [k, v] of Object.entries(map)) {
    map[k] = { id: Number(k), ...v };
  }
  return map;
}

export const CLASS_MAP = buildClassMap();

function decodeFamily(classId) {
  const id = Number(classId);
  if (!Number.isFinite(id) || id < 0) return null;
  const group = Math.floor(id / 16);
  const stage = id % 16;
  const fam = FAMILIES[group];
  if (!fam) return null;
  const name = fam.stages[Math.min(stage, fam.stages.length - 1)] || fam.stages[0];
  return { id, name, short: fam.short, group: fam.group };
}

export function resolveClass(classId) {
  const id = Number(classId);
  if (CLASS_MAP[id]) return CLASS_MAP[id];
  const decoded = decodeFamily(id);
  if (decoded) return decoded;
  return {
    id,
    name: `Class ${id}`,
    short: `C${id}`,
    group: id,
    unknown: true,
  };
}
