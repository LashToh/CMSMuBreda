/**
 * Season 21 Part 1 — Crusader & permanent season content.
 * Translatable UI text lives in src/i18n/translations/*.js
 * Visual assets: guiamuonline.com/season-21/
 */

import { excludeSpeedServerItems } from '../utils/excludeSpeedServer';

export const CRUSADER = {
  stats: [
    { key: 'holyAttack', value: 40, max: 50, icon: '✦' },
    { key: 'strength', value: 26, max: 50, icon: '⚔' },
    { key: 'agility', value: 18, max: 50, icon: '↯' },
    { key: 'energy', value: 20, max: 50, icon: '☀' },
  ],
};

const RAW_SKILLS = [
  {
    id: 'divine-fall',
    name: 'Divine Fall',
    typeKey: 'offensive',
    requirement: 'STR · AGI',
    image: '/assets/skills/divine-fall-icon.jpg',
    previewImage: '/assets/skills/divine-fall-preview.jpg',
    color: '#C61717',
  },
  {
    id: 'holy-sweep',
    name: 'Holy Sweep',
    typeKey: 'offensive',
    requirement: 'STR · AGI',
    image: '/assets/skills/holy-sweep-icon.jpg',
    previewImage: '/assets/skills/holy-sweep-preview.jpg',
    color: '#F0D08A',
  },
  {
    id: 'sacred-impact',
    name: 'Sacred Impact',
    typeKey: 'offensive',
    requirement: 'STR · AGI',
    image: '/assets/skills/sacred-impact-icon.jpg',
    previewImage: '/assets/skills/sacred-impact-preview.jpg',
    color: '#C61717',
  },
  {
    id: 'lugards-blessing',
    name: "Lugard's Blessing: Retaliation",
    typeKey: 'buff',
    requirement: 'Energy',
    image: '/assets/skills/lugards-blessing-icon.jpg',
    previewImage: '/assets/skills/lugards-blessing-preview.jpg',
    color: '#F0D08A',
  },
];

export const SKILLS = excludeSpeedServerItems(RAW_SKILLS);

export const HAMMER_TIERS = [
  { name: 'Blast Hammer', image: '/assets/weapons/blast-hammer.jpg', damageMin: 195, damageMax: 210, attackSpeed: 40, requirements: 'STR 410 · AGI 176' },
  { name: 'Belief Hammer', image: '/assets/weapons/belief-hammer.jpg', damageMin: 260, damageMax: 275, attackSpeed: 40, requirements: 'STR 560 · AGI 236' },
  { name: 'Darkangel Hammer', image: '/assets/weapons/darkangel-hammer.jpg', damageMin: 342, damageMax: 353, attackSpeed: 40, requirements: 'STR 697 · AGI 286' },
  { name: 'Holyangel Hammer', image: '/assets/weapons/holyangel-hammer.jpg', damageMin: 409, damageMax: 420, attackSpeed: 40, requirements: 'STR 733 · AGI 302' },
  { name: 'Soul Hammer', image: '/assets/weapons/soul-hammer.jpg', damageMin: 475, damageMax: 486, attackSpeed: 40, requirements: 'STR 776 · AGI 317' },
  { name: 'Blue Eye Hammer', image: '/assets/weapons/blue-eye-hammer.jpg', damageMin: 541, damageMax: 551, attackSpeed: 40, requirements: 'STR 813 · AGI 332' },
  { name: 'Silver Heart Hammer', image: '/assets/weapons/silver-heart-hammer.jpg', damageMin: 607, damageMax: 618, attackSpeed: 40, requirements: 'STR 826 · AGI 344' },
  { name: 'Manticore Hammer', image: '/assets/weapons/manticore-hammer.jpg', damageMin: 673, damageMax: 685, attackSpeed: 40, requirements: 'STR 826 · AGI 344' },
  { name: 'Brilliant Hammer', image: '/assets/weapons/brilliant-hammer.jpg', damageMin: 739, damageMax: 752, attackSpeed: 40, requirements: 'STR 826 · AGI 344' },
  { name: 'Apocalypse Hammer', image: '/assets/weapons/apocalypse-hammer.jpg', damageMin: 804, damageMax: 818, attackSpeed: 40, requirements: 'STR 826 · AGI 344' },
  { name: 'Lightning Hammer', image: '/assets/weapons/lightning-hammer.jpg', damageMin: 869, damageMax: 884, attackSpeed: 40, requirements: 'STR 826 · AGI 344' },
  { name: 'Temple Guard Hammer', image: '/assets/weapons/temple-guard-hammer.jpg', damageMin: 935, damageMax: 950, attackSpeed: 40, requirements: 'STR 826 · AGI 344' },
];

export const SHIELD_TIERS = [
  { name: 'Blast Shield', image: '/assets/weapons/blast-shield.jpg', defense: 24, defenseRate: 78, requirements: 'STR 407 · AGI 173' },
  { name: 'Belief Shield', image: '/assets/weapons/belief-shield.jpg', defense: 33, defenseRate: 90, requirements: 'STR 556 · AGI 232' },
  { name: 'Darkangel Paladin Shield', image: '/assets/weapons/darkangel-paladin-shield.png', defense: 51, defenseRate: 109, requirements: 'STR 669 · AGI 258' },
  { name: 'Holyangel Paladin Shield', image: '/assets/weapons/holyangel-paladin-shield.png', defense: 59, defenseRate: 110, requirements: 'STR 684 · AGI 266' },
  { name: 'Soul Paladin Shield', image: '/assets/weapons/soul-paladin-shield.png', defense: 69, defenseRate: 111, requirements: 'STR 695 · AGI 269' },
  { name: 'Blue Eye Paladin Shield', image: '/assets/weapons/blue-eye-paladin-shield.png', defense: 79, defenseRate: 114, requirements: 'STR 726 · AGI 285' },
  { name: 'Silver Heart Paladin Shield', image: '/assets/weapons/silver-heart-paladin-shield.png', defense: 89, defenseRate: 115, requirements: 'STR 726 · AGI 285' },
  { name: 'Manticore Paladin Shield', image: '/assets/weapons/manticore-paladin-shield.jpg', defense: 99, defenseRate: 117, requirements: 'STR 726 · AGI 285' },
  { name: 'Brilliant Paladin Shield', image: '/assets/weapons/brilliant-paladin-shield.jpg', defense: 109, defenseRate: 119, requirements: 'STR 726 · AGI 285' },
  { name: 'Apocalypse Paladin Shield', image: '/assets/weapons/apocalypse-paladin-shield.jpg', defense: 119, defenseRate: 122, requirements: 'STR 726 · AGI 285' },
  { name: 'Lightning Paladin Shield', image: '/assets/weapons/lightning-paladin-shield.jpg', defense: 129, defenseRate: 124, requirements: 'STR 726 · AGI 285' },
  { name: 'Temple Guard Paladin Shield', image: '/assets/weapons/temple-guard-paladin-shield.jpg', defense: 144, defenseRate: 190, requirements: 'STR 726 · AGI 285' },
];

export const WEAPONS = [
  {
    id: 'temple-guard-hammer',
    weaponType: 'hammer',
    image: '/assets/weapons/temple-guard-hammer.jpg',
    tiers: HAMMER_TIERS,
    align: 'left',
  },
  {
    id: 'temple-guard-shield',
    weaponType: 'shield',
    image: '/assets/weapons/temple-guard-paladin-shield.jpg',
    tiers: SHIELD_TIERS,
    align: 'right',
  },
];

const RAW_SEASON21_FEATURES = [
  { id: 'crusader-class', icon: 'GiCrossedSwords' },
  { id: 'holy-attack-stat', icon: 'GiCrystalGrowth' },
  { id: 'lugards-blessing', icon: 'GiShield' },
  { id: 'offensive-holy-skills', icon: 'GiCastle' },
  { id: 'contract-items', icon: 'GiTreasureMap' },
  { id: 'leader-board', icon: 'GiDragonHead' },
];

export const SEASON21_FEATURES = excludeSpeedServerItems(RAW_SEASON21_FEATURES);

const RAW_TIMELINE = [
  { id: 'open-beta', active: true },
  { id: 'crusader-kit', active: false },
  { id: 'official-launch', active: false },
];

export const TIMELINE = excludeSpeedServerItems(RAW_TIMELINE);

export const GALLERY_ITEMS = excludeSpeedServerItems([
  { id: 'crusader-class', type: 'image', gradient: 'linear-gradient(135deg, #1B0000, #6D0000)' },
  { id: 'holy-skills', type: 'video', gradient: 'linear-gradient(135deg, #121212, #1B0000)' },
  { id: 'gear-hammer', type: 'image', gradient: 'linear-gradient(135deg, #6D0000, #C61717)' },
  { id: 'paladin-shield', type: 'image', gradient: 'linear-gradient(135deg, #090909, #6D0000)' },
  { id: 'sacred-impact', type: 'video', gradient: 'linear-gradient(135deg, #1B0000, #121212)' },
  { id: 'lugards-blessing', type: 'image', gradient: 'linear-gradient(135deg, #C61717, #1B0000)' },
]);

export const SOCIAL_LINKS = [
  { id: 'discord', href: 'https://discord.gg/SV6yW7XK7' },
  { id: 'instagram', href: 'https://www.instagram.com/mubredaonline/' },
  { id: 'facebook', href: 'https://www.facebook.com/mubredaonline' },
];
