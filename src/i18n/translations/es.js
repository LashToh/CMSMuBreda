export default {
  nav: {
    crusader: 'Crusader',
    arsenal: 'Arsenal',
    skills: 'Habilidades',
    features: 'Novedades',
    timeline: 'Cronograma',
    register: 'Registrarse',
    playNow: 'Jugar Ahora',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
  },
  hero: {
    brand: 'Mu Breda',
    beta: 'Beta Abierta',
    season: 'Temporada 21',
    titleAccent: 'The Crusader Awakens',
    subtitle:
      'Un campeón divino forjado en el resplandor de LUGARD. Empuña martillo y escudo exclusivos, golpea con poder sagrado y potencia a tu grupo con la bendición de Lugard.',
    download: 'Descargar',
    scroll: 'Desplazar',
  },
  crusader: {
    sectionLabel: 'Nueva Clase — Temporada 21',
    title: 'The Crusader',
    badge: 'Nueva Clase — Temporada 21 Parte 1',
    lore: [
      'Un campeón divino forjado en el resplandor de LUGARD — Crusader llega al continente MU como guerrero sagrado de primera línea.',
      'Armado con un Gear Hammer y Paladin Shield exclusivos, Crusader aplasta enemigos con la luz de Lugard mientras la nueva estadística Holy Attack y el Sigil of Retaliation fortalecen el combate en solitario y en grupo.',
    ],
    role: 'Guerrero sagrado de primera línea — martillo y escudo exclusivos, stat Holy Attack, buff de daño grupal',
    roleLabel: 'Rol',
    weaponsLabel: 'Armas',
    exclusiveStatLabel: 'Stat exclusivo',
    buffSkillLabel: 'Habilidad de buff',
    portraitAlt: 'The Crusader — Campeón divino de Lugard',
    stats: {
      holyAttack: 'Holy Attack',
      strength: 'Fuerza',
      agility: 'Agilidad',
      energy: 'Energía',
    },
    baseInfo: {
      weapons: 'Gear Hammer exclusivo (mano principal) + Paladin Shield (mano secundaria)',
      holyAttack: 'Stat Holy Attack exclusivo añadido a la clase Crusader',
      offensiveSkills: 'Divine Fall · Holy Sweep · Sacred Impact',
      buffSkill: "Lugard's Blessing: Retaliation",
    },
  },
  weapons: {
    sectionLabel: 'Arsenal',
    title: 'Armas de Luz',
    subtitle:
      'Equipamiento real Crusader Temporada 21 EP1-2 — tiers de martillo y Paladin Shield desde Blast hasta Temple Guard. Selecciona cualquier tier para ver el arte oficial del juego.',
    fullTierLine: 'Línea completa de tiers',
    stats: {
      damage: 'Daño',
      attackSpeed: 'Vel. de Ataque',
      requirements: 'Requisitos',
      defense: 'Defensa',
      defenseRate: 'Tasa de Defensa',
    },
    items: {
      'temple-guard-hammer': {
        subtitle: 'Mano Principal Crusader — Temporada 21 EP1-2',
        description:
          'Martillo Crusader de máximo tier de la línea Temporada 21 Episodio 1-2. Empuña la luz de Lugard con la progresión completa de martillos — de Blast a Temple Guard — junto a Paladin Shields a juego.',
      },
      'temple-guard-shield': {
        subtitle: 'Mano Secundaria Crusader — Temporada 21 EP1-2',
        description:
          'Paladin Shield end-game para la clase Crusader. Combina con la línea Gear Hammer desde Blast Shield hasta Temple Guard para defensa completa de caballero sagrado.',
      },
    },
  },
  skills: {
    sectionLabel: 'Combate',
    title: 'Habilidades Sagradas',
    subtitle:
      'Tres habilidades ofensivas (STR · AGI) y un buff grupal (Energy) — todo tematizado con la luz de Lugard.',
    types: {
      offensive: 'Habilidad Ofensiva',
      buff: 'Habilidad de Buff',
    },
    previewAlt: 'Vista previa de {name}',
    items: {
      'divine-fall': {
        description:
          'Un sigilo formado por la luz de Lugard desciende del cielo para infligir daño a los enemigos.',
      },
      'holy-sweep': {
        description:
          'Gira un martillo grabado con la luz de Lugard para embestir hacia los enemigos.',
      },
      'sacred-impact': {
        description:
          'La marca de Lugard busca enemigos para infligir daño a múltiples objetivos.',
      },
      'lugards-blessing': {
        description:
          'Genera el Sigil of Retaliation y aumenta el daño de ti y de los miembros de tu grupo.',
      },
    },
  },
  features: {
    sectionLabel: 'Temporada XXI',
    title: 'Novedades',
    subtitle:
      'Temporada 21 Parte 1: clase Crusader, stat Holy Attack, habilidades sagradas de Lugard, Contract items y actualizaciones del Leader Board.',
    items: {
      'crusader-class': {
        title: 'Clase Crusader',
        description:
          'Un campeón divino forjado en el resplandor de LUGARD. Nueva clase de primera línea con martillo y escudo exclusivos.',
      },
      'holy-attack-stat': {
        title: 'Stat Holy Attack',
        description:
          'La clase Crusader recibe un stat Holy Attack exclusivo — un nuevo atributo ligado al poder sagrado de Lugard.',
      },
      'lugards-blessing': {
        title: "Lugard's Blessing: Retaliation",
        description:
          'Genera el Sigil of Retaliation y aumenta el daño de ti y de los miembros de tu grupo.',
      },
      'offensive-holy-skills': {
        title: 'Habilidades Sagradas Ofensivas',
        description:
          'Tres habilidades de ataque exclusivas — Divine Fall, Holy Sweep y Sacred Impact — potenciadas por STR y AGI.',
      },
      'contract-items': {
        title: 'Contract Items',
        description:
          'Los Scroll Buff items son reemplazados por Contract items. Los Buff Scrolls restantes siguen siendo usables.',
      },
      'leader-board': {
        title: 'Actualización Leader Board',
        description:
          'El Leader Board se actualiza con los mapas más recientes; los mapas antiguos fueron eliminados del ranking.',
      },
    },
  },
  timeline: {
    sectionLabel: 'Hoja de Ruta',
    title: 'Cronograma de Temporada',
    subtitle:
      'Temporada 21 Parte 1 está en beta abierta — el contenido Crusader es jugable ahora; fecha de lanzamiento oficial por confirmar.',
    current: 'Actual',
    items: {
      'open-beta': {
        label: 'Activo Ahora',
        title: 'Beta Abierta',
        description:
          'Temporada 21 Parte 1 está en beta abierta. Prueba la clase Crusader, Contract items y actualizaciones del Leader Board.',
      },
      'crusader-kit': {
        label: 'En Beta',
        title: 'Crusader Kit',
        description:
          'Gear Hammer y Paladin Shield exclusivos, stat Holy Attack y cuatro habilidades temáticas de Lugard disponibles para pruebas.',
      },
      'official-launch': {
        label: 'Por Confirmar',
        title: 'Lanzamiento Oficial',
        description:
          'Lanzamiento completo de Temporada 21 Parte 1 en servidores oficiales — fecha por anunciar por Webzen.',
      },
    },
  },
  download: {
    sectionLabel: 'Únete a la Batalla',
    titleLine1: 'The Crusader',
    titleLine2: 'Te Espera',
    subtitle:
      'Juega como Crusader — campeón divino de Lugard. Domina habilidades ofensivas sagradas, empuña martillo y escudo exclusivos y potencia a tu grupo con el Sigil of Retaliation.',
    downloadClient: 'Descargar Cliente',
    registerAccount: 'Registrar Cuenta',
    joinDiscord: 'Unirse a Discord',
    systemRequirements: 'Requisitos del Sistema',
    minimum: 'Mínimo',
    recommended: 'Recomendado',
    req: {
      osMin: 'SO: Windows 10 64-bit',
      cpuMin: 'CPU: Intel i3 / AMD Ryzen 3',
      ramMin: 'RAM: 4 GB',
      gpuMin: 'GPU: GTX 750 Ti',
      storageMin: 'Almacenamiento: 8 GB',
      osRec: 'SO: Windows 11 64-bit',
      cpuRec: 'CPU: Intel i5 / AMD Ryzen 5',
      ramRec: 'RAM: 8 GB',
      gpuRec: 'GPU: GTX 1060',
      storageRec: 'Almacenamiento: 12 GB SSD',
    },
  },
  footer: {
    brandName: 'Mu Breda · Temporada 21',
    tagline:
      'Landing promocional fan-made para Mu Breda Temporada 21. No afiliado a Webzen Inc.',
    copyright: '© 2026 LashToh. Todos los derechos reservados.',
    disclaimer: 'MU Online es una marca registrada de Webzen Inc.',
    groups: {
      game: {
        title: 'Juego',
        links: ['Descargar', 'Registrarse', 'Rankings', 'Soporte'],
      },
      community: {
        title: 'Comunidad',
        links: ['Foros', 'Discord', 'Eventos', 'Fan Art'],
      },
      legal: {
        title: 'Legal',
        links: ['Términos de Servicio', 'Política de Privacidad', 'Política de Cookies'],
      },
    },
    social: {
      discord: 'Discord',
      twitter: 'Twitter',
      youtube: 'YouTube',
      facebook: 'Facebook',
    },
  },
  register: {
    sectionLabel: 'Crear Cuenta',
    title: 'Registrarse para Temporada 21',
    intro:
      'Crea tu cuenta Mu Breda. Usuario: 4–10 alfanuméricos. Contraseña: 4–20 caracteres. El email es obligatorio.',
    username: 'Usuario',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    email: 'Email',
    usernamePlaceholder: '4–10 alfanuméricos',
    passwordPlaceholder: '4–20 caracteres',
    emailPlaceholder: 'recovery@email.com',
    submit: 'Registrar Cuenta',
    submitting: 'Creando cuenta…',
    close: 'Cerrar formulario de registro',
    success: 'Cuenta creada exitosamente. Ya puedes iniciar sesión con el cliente del juego.',
    errors: {
      generic: 'Error al registrar. Inténtalo de nuevo.',
      NETWORK_ERROR: 'No se puede conectar al servidor de registro. Verifica que la API esté activa y que VITE_API_URL esté configurado.',
      USERNAME_INVALID: 'El usuario debe tener 4–10 caracteres alfanuméricos.',
      PASSWORD_INVALID: 'La contraseña debe tener 4–20 caracteres.',
      PASSWORD_MISMATCH: 'Las contraseñas no coinciden.',
      EMAIL_REQUIRED: 'El email es obligatorio.',
      EMAIL_INVALID: 'Dirección de email inválida.',
      EMAIL_TAKEN: 'El email ya está registrado.',
      USERNAME_TAKEN: 'El nombre de usuario ya está en uso.',
      RATE_LIMITED: 'Demasiados intentos de registro. Inténtalo más tarde.',
      SERVER_ERROR: 'Error al registrar. Inténtalo de nuevo más tarde.',
    },
  },
  social: {
    discord: 'Discord',
    instagram: 'Instagram',
    facebook: 'Facebook',
    ariaLabel: 'Enlaces a redes sociales',
  },
  common: {
    logoAlt: 'Mu Breda Temporada 21',
    selectLanguage: 'Seleccionar idioma',
  },
  error: {
    title: 'Algo salió mal',
    message:
      'La página no pudo cargarse. Actualiza el navegador o ejecuta npm run dev (no Live Server en index.html raíz).',
  },
  gallery: {
    sectionLabel: 'Media',
    title: 'Galería',
    subtitle: 'Clase Crusader, equipamiento exclusivo y habilidades sagradas de Lugard — media Temporada 21 Parte 1.',
    videoPreview: 'Vista previa de video',
    close: 'Cerrar',
    items: {
      'crusader-class': { title: 'Clase Crusader' },
      'holy-skills': { title: 'Holy Sweep & Divine Fall' },
      'gear-hammer': { title: 'Gear Hammer Exclusivo' },
      'paladin-shield': { title: 'Paladin Shield' },
      'sacred-impact': { title: 'Sacred Impact' },
      'lugards-blessing': { title: "Lugard's Blessing: Retaliation" },
    },
  },
};
