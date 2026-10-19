function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value;
}

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const serverInfo = {
  name: env('SERVER_NAME', 'MU Breda'),
  season: env('SERVER_SEASON', '21'),
  exp: env('SERVER_EXP', '9999x'),
  masterExp: env('SERVER_MASTER_EXP', '9999x'),
  drop: env('SERVER_DROP', '50%'),
  maxLevel: envInt('SERVER_MAX_LEVEL', 1750),
  maxMasterLevel: envInt('SERVER_MAX_MASTER_LEVEL', 400),
  resetLevel: envInt('RESET_LEVEL', 400),
  discordUrl: env('DISCORD_URL', 'https://discord.gg/SV6yW7XK7'),
  downloadUrl: env('DOWNLOAD_URL', ''),
  instagramUrl: env('INSTAGRAM_URL', 'https://www.instagram.com/mubredaonline/'),
  facebookUrl: env('FACEBOOK_URL', 'https://www.facebook.com/mubredaonline/'),
  /** GameServer TCP check for Online/Offline on the home page */
  gsHost: env('GS_HOST', env('GAME_SERVER_HOST', '')),
  gsPort: envInt('GS_PORT', envInt('GAME_SERVER_PORT', 55901)),
  gsCheckTimeoutMs: envInt('GS_CHECK_TIMEOUT_MS', 1500),
};
