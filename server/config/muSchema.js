function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value;
}

/**
 * Configurable MU Online table/column mappings.
 * Do not hardcode Season 6 assumptions in controllers — use this schema.
 */
export const muSchema = {
  accounts: {
    table: env('MU_TABLE_ACCOUNTS', 'MEMB_INFO'),
    username: env('MU_COL_USERNAME', 'memb___id'),
    password: env('MU_COL_PASSWORD', 'memb__pwd'),
    email: env('MU_COL_EMAIL', 'mail_addr'),
    bloc: env('MU_COL_BLOC', 'bloc_code'),
    guid: env('MU_COL_GUID', 'memb_guid'),
    name: env('MU_COL_MEMB_NAME', 'memb_name'),
    sno: env('MU_COL_SNO', 'sno__numb'),
    ctl: env('MU_COL_CTL', 'ctl1_code'),
  },
  characters: {
    table: env('MU_TABLE_CHARACTERS', 'Character'),
    name: env('MU_COL_CHAR_NAME', 'Name'),
    account: env('MU_COL_CHAR_ACCOUNT', 'AccountID'),
    class: env('MU_COL_CHAR_CLASS', 'Class'),
    level: env('MU_COL_CHAR_LEVEL', 'cLevel'),
    resets: env('MU_COL_CHAR_RESETS', 'RESETS'),
    grandResets: env('MU_COL_CHAR_GRAND_RESETS', 'GrandResets'),
    masterLevel: env('MU_COL_CHAR_MASTER_LEVEL', 'mLevel'),
    strength: env('MU_COL_CHAR_STR', 'Strength'),
    agility: env('MU_COL_CHAR_AGI', 'Dexterity'),
    vitality: env('MU_COL_CHAR_VIT', 'Vitality'),
    energy: env('MU_COL_CHAR_ENE', 'Energy'),
    command: env('MU_COL_CHAR_CMD', 'Leadership'),
    pkLevel: env('MU_COL_CHAR_PK_LEVEL', 'PkLevel'),
    pkCount: env('MU_COL_CHAR_PK_COUNT', 'PkCount'),
    map: env('MU_COL_CHAR_MAP', 'MapNumber'),
    posX: env('MU_COL_CHAR_POS_X', 'MapPosX'),
    posY: env('MU_COL_CHAR_POS_Y', 'MapPosY'),
    money: env('MU_COL_CHAR_MONEY', 'Money'),
    levelUpPoint: env('MU_COL_CHAR_LUP', 'LevelUpPoint'),
  },
  membStat: {
    table: env('MU_TABLE_MEMB_STAT', 'MEMB_STAT'),
    username: env('MU_COL_STAT_USER', 'memb___id'),
    connectStat: env('MU_COL_CONNECT_STAT', 'ConnectStat'),
  },
  guild: {
    table: env('MU_TABLE_GUILD', 'Guild'),
    name: env('MU_COL_GUILD_NAME', 'G_Name'),
    master: env('MU_COL_GUILD_MASTER', 'G_Master'),
    score: env('MU_COL_GUILD_SCORE', 'G_Score'),
    mark: env('MU_COL_GUILD_MARK', 'G_Mark'),
  },
  guildMember: {
    table: env('MU_TABLE_GUILD_MEMBER', 'GuildMember'),
    name: env('MU_COL_GM_NAME', 'Name'),
    guild: env('MU_COL_GM_GUILD', 'G_Name'),
  },
  currencies: {
    credits: {
      table: env('CURRENCY_CREDITS_TABLE', 'MEMB_CREDITS'),
      column: env('CURRENCY_CREDITS_COLUMN', 'credits'),
      userColumn: env('CURRENCY_CREDITS_USER_COLUMN', 'memb___id'),
    },
    wcoinc: {
      table: env('CURRENCY_WCOINC_TABLE', ''),
      column: env('CURRENCY_WCOINC_COLUMN', 'WCoinC'),
      userColumn: env('CURRENCY_WCOINC_USER_COLUMN', 'AccountID'),
    },
    wcoinp: {
      table: env('CURRENCY_WCOINP_TABLE', ''),
      column: env('CURRENCY_WCOINP_COLUMN', 'WCoinP'),
      userColumn: env('CURRENCY_WCOINP_USER_COLUMN', 'AccountID'),
    },
    goblin: {
      table: env('CURRENCY_GOBLIN_TABLE', ''),
      column: env('CURRENCY_GOBLIN_COLUMN', 'GoblinPoint'),
      userColumn: env('CURRENCY_GOBLIN_USER_COLUMN', 'AccountID'),
    },
  },
  vip: {
    table: env('VIP_TABLE', 'T_VIPList'),
    userColumn: env('VIP_USER_COLUMN', 'AccountID'),
    typeColumn: env('VIP_TYPE_COLUMN', 'Type'),
    dateColumn: env('VIP_DATE_COLUMN', 'Date'),
  },
  /**
   * MuDevs event ranking tables live in the character DB (MuOnline) by default.
   * Only set DB_DATABASE_RANKING if you use a separate Ranking database.
   * Castle Siege / Duel use KillScore / WinScore (not Score).
   */
  devilSquare: {
    table: env('MU_TABLE_DEVIL_SQUARE', 'RankingDevilSquare'),
    name: env('MU_COL_DS_NAME', 'Name'),
    score: env('MU_COL_DS_SCORE', 'Score'),
  },
  bloodCastle: {
    table: env('MU_TABLE_BLOOD_CASTLE', 'RankingBloodCastle'),
    name: env('MU_COL_BC_NAME', 'Name'),
    score: env('MU_COL_BC_SCORE', 'Score'),
  },
  castleSiege: {
    table: env('MU_TABLE_CASTLE_SIEGE', 'RankingCastleSiege'),
    name: env('MU_COL_CS_NAME', 'Name'),
    score: env('MU_COL_CS_SCORE', 'KillScore'),
  },
  chaosCastle: {
    table: env('MU_TABLE_CHAOS_CASTLE', 'RankingChaosCastle'),
    name: env('MU_COL_CC_NAME', 'Name'),
    score: env('MU_COL_CC_SCORE', 'Score'),
  },
  duel: {
    table: env('MU_TABLE_DUEL', 'RankingDuel'),
    name: env('MU_COL_DUEL_NAME', 'Name'),
    score: env('MU_COL_DUEL_SCORE', 'WinScore'),
  },
  illusionTemple: {
    table: env('MU_TABLE_ILLUSION_TEMPLE', 'RankingIllusionTemple'),
    name: env('MU_COL_IT_NAME', 'Name'),
    score: env('MU_COL_IT_SCORE', 'Score'),
  },
};
