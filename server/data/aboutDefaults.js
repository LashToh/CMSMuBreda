/**
 * Default "Server Info / About" content for MU Breda.
 * Editable later via AdminCP → Server Info (stored in cms-local.json).
 * Labels support { es, en, pt }; value is plain text (same for all locales).
 */
function L(es, en, pt) {
  return { es, en: en || es, pt: pt || en || es };
}

function row(label, value) {
  return { label, value: String(value) };
}

export const ABOUT_DEFAULTS = {
  updatedAt: null,
  sections: [
    {
      id: 'general',
      title: L('General', 'General', 'Geral'),
      rows: [
        row(L('Nombre del server', 'Server name', 'Nome do servidor'), 'MU Breda'),
        row(L('Versión', 'Version', 'Versão'), 'Season 21'),
        row(L('EXP regular', 'Regular EXP', 'EXP regular'), '9999x'),
        row(L('EXP Master', 'Master EXP', 'EXP Master'), '9999x'),
        row(L('EXP Eventos', 'Event EXP', 'EXP de eventos'), '5x'),
        row(L('Drop', 'Drop', 'Drop'), '30%'),
        row(L('Zen drop', 'Zen drop', 'Drop de Zen'), '10%'),
        row(L('Nivel máximo (regular)', 'Max regular level', 'Nível máximo (regular)'), '400'),
        row(L('Nivel máximo total', 'Max total level', 'Nível máximo total'), '1750'),
        row(L('Puntos por nivel', 'Points per level', 'Pontos por nível'), '5 / 7 (según clase)'),
        row(L('Resets / Grand Reset', 'Resets / Grand Reset', 'Resets / Grand Reset'), 'No (progresión por nivel)'),
        row(L('Tipo', 'Type', 'Tipo'), 'PvP · Season 21'),
      ],
    },
    {
      id: 'chaos',
      title: L('Chaos Machine', 'Chaos Machine', 'Chaos Machine'),
      rows: [
        row(L('Item +10', 'Item +10', 'Item +10'), '60%'),
        row(L('Item +11', 'Item +11', 'Item +11'), '60%'),
        row(L('Item +12', 'Item +12', 'Item +12'), '50%'),
        row(L('Item +13', 'Item +13', 'Item +13'), '50%'),
        row(L('Item +14', 'Item +14', 'Item +14'), '40%'),
        row(L('Item +15', 'Item +15', 'Item +15'), '40%'),
        row(L('Wings 2 / 3 / Feather', 'Wings 2 / 3 / Feather', 'Wings 2 / 3 / Feather'), 'Rate default del engine (−1)'),
        row(L('Ticket Devil Square', 'Devil Square ticket', 'Ticket Devil Square'), '80% (DS1–4) · 70% (DS5–7)'),
      ],
    },
    {
      id: 'commands',
      title: L('Comandos', 'Commands', 'Comandos'),
      rows: [
        row(L('/post', '/post', '/post'), 'Mensaje global'),
        row(L('/add str|agi|vit|ene|cmd', '/add str|agi|vit|ene|cmd', '/add str|agi|vit|ene|cmd'), 'Agregar puntos de stat'),
        row(L('/dec str|agi|vit|ene|cmd', '/dec str|agi|vit|ene|cmd', '/dec str|agi|vit|ene|cmd'), 'Quitar puntos de stat'),
        row(L('/requests on|off', '/requests on|off', '/requests on|off'), 'Trade / duelo'),
        row(L('/pkclear', '/pkclear', '/pkclear'), 'Limpiar PK (si está habilitado)'),
        row(L('/offtrade', '/offtrade', '/offtrade'), 'Tienda offline'),
        row(L('/offlevel', '/offlevel', '/offlevel'), 'Offlevel (si está habilitado)'),
      ],
    },
    {
      id: 'events',
      title: L('Eventos', 'Events', 'Eventos'),
      rows: [
        row(L('Blood Castle', 'Blood Castle', 'Blood Castle'), 'Activo · brackets hasta 1700+'),
        row(L('Devil Square', 'Devil Square', 'Devil Square'), 'Activo · brackets hasta 1700+'),
        row(L('Chaos Castle', 'Chaos Castle', 'Chaos Castle'), 'Activo'),
        row(L('Illusion Temple', 'Illusion Temple', 'Illusion Temple'), 'Activo'),
        row(L('Castle Siege', 'Castle Siege', 'Castle Siege'), 'Activo'),
        row(L('Imperial Guardian / DG / etc.', 'Imperial Guardian / DG / etc.', 'Imperial Guardian / DG / etc.'), 'Según schedule del server'),
      ],
    },
    {
      id: 'community',
      title: L('Comunidad', 'Community', 'Comunidade'),
      rows: [
        row(L('Discord', 'Discord', 'Discord'), 'https://discord.gg/SV6yW7XK7'),
        row(L('Instagram', 'Instagram', 'Instagram'), 'https://www.instagram.com/mubredaonline/'),
        row(L('Facebook', 'Facebook', 'Facebook'), 'https://www.facebook.com/mubredaonline/'),
        row(L('Web / Rankings', 'Web / Rankings', 'Web / Rankings'), 'https://mubreda.net'),
      ],
    },
  ],
};

export function cloneAboutDefaults() {
  return structuredClone(ABOUT_DEFAULTS);
}
