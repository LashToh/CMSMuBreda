/** Fallback URLs if /api/server is unreachable. Prefer AdminCP → Settings. */
export const SOCIAL_LINK_DEFAULTS = {
  discord: 'https://discord.gg/SV6yW7XK7',
  instagram: 'https://www.instagram.com/mubredaonline/',
  facebook: 'https://www.facebook.com/mubredaonline',
};

export const SOCIAL_LINK_ORDER = ['discord', 'instagram', 'facebook'];

/**
 * Build social links from public /api/server payload (AdminCP settings).
 * @param {{ discordUrl?: string, instagramUrl?: string, facebookUrl?: string }} server
 */
export function resolveSocialLinks(server = {}) {
  const map = {
    discord: String(server.discordUrl || SOCIAL_LINK_DEFAULTS.discord).trim(),
    instagram: String(server.instagramUrl || SOCIAL_LINK_DEFAULTS.instagram).trim(),
    facebook: String(server.facebookUrl || SOCIAL_LINK_DEFAULTS.facebook).trim(),
  };
  return SOCIAL_LINK_ORDER.filter((id) => map[id] && map[id] !== '#').map((id) => ({
    id,
    href: map[id],
  }));
}

/** @deprecated use resolveSocialLinks — kept for any static imports */
export const SOCIAL_LINKS = resolveSocialLinks();
