const GAME_DATA = {
  lol: {
    name: 'League of Legends', abbr: 'LoL', bg: '#0a1428', accent: '#c8aa6e', genre: 'MOBA',
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
    roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
  },
  valorant: {
    name: 'Valorant', abbr: 'VAL', bg: '#0f1923', accent: '#ff4655', genre: 'FPS',
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
    roles: ['Duelist', 'Initiator', 'Controller', 'Sentinel'],
  },
  tft: {
    name: 'TFT', abbr: 'TFT', bg: '#1a1040', accent: '#e8b840', genre: 'Auto Battler',
    ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
    roles: [],
  },
  minecraft: {
    name: 'Minecraft', abbr: 'MC', bg: '#3b2314', accent: '#62b44b', genre: 'Sandbox',
    ranks: [],
    roles: ['Builder', 'Redstoner', 'Explorer', 'PvP', 'Survival'],
  },
  cod: {
    name: 'Call of Duty', abbr: 'COD', bg: '#1a1a1a', accent: '#ff8c00', genre: 'FPS',
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crimson', 'Iridescent', 'Top 250'],
    roles: ['Assault', 'SMG', 'Sniper', 'Support'],
  },
  apex: {
    name: 'Apex Legends', abbr: 'APX', bg: '#141414', accent: '#cd3333', genre: 'Battle Royale',
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Predator'],
    roles: ['Assault', 'Skirmisher', 'Recon', 'Support', 'Controller'],
  },
  cs2: {
    name: 'CS2', abbr: 'CS2', bg: '#1b2838', accent: '#de9b35', genre: 'FPS',
    ranks: ['Silver', 'Gold Nova', 'Master Guardian', 'Legendary Eagle', 'Supreme', 'Global Elite'],
    roles: ['Entry', 'AWPer', 'Support', 'IGL', 'Lurker'],
  },
  fortnite: {
    name: 'Fortnite', abbr: 'FN', bg: '#1a1a2e', accent: '#2fc1f0', genre: 'Battle Royale',
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Unreal'],
    roles: ['Builder', 'Fighter', 'Support', 'All-Round'],
  },
  dota2: {
    name: 'Dota 2', abbr: 'D2', bg: '#0d0d0d', accent: '#e44444', genre: 'MOBA',
    ranks: ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'],
    roles: ['Carry', 'Mid', 'Offlane', 'Soft Support', 'Hard Support'],
  },
  ow2: {
    name: 'Overwatch 2', abbr: 'OW2', bg: '#2a2a40', accent: '#fa9c1e', genre: 'FPS',
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Champion'],
    roles: ['Tank', 'DPS', 'Support'],
  },
  deadlock: {
    name: 'Deadlock', abbr: 'DL', bg: '#1a1a2e', accent: '#8b5cf6', genre: 'MOBA Shooter',
    ranks: [],
    roles: ['Carry', 'Ganker', 'Support', 'Flex'],
  },
  rl: {
    name: 'Rocket League', abbr: 'RL', bg: '#0d1117', accent: '#005dff', genre: 'Sports',
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion', 'Supersonic Legend'],
    roles: ['Striker', 'Defender', 'All-Round'],
  },
  pubg: {
    name: 'PUBG', abbr: 'PBG', bg: '#1a1a1a', accent: '#f2a900', genre: 'Battle Royale',
    ranks: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'],
    roles: ['Sniper', 'Rusher', 'Support', 'All-Round'],
  },
  elden: {
    name: 'Elden Ring', abbr: 'ER', bg: '#1a1510', accent: '#c5a55a', genre: 'RPG',
    ranks: [],
    roles: ['Melee', 'Caster', 'Hybrid', 'Challenge Runner'],
  },
  diablo: {
    name: 'Diablo IV', abbr: 'D4', bg: '#0d0d0d', accent: '#cc3333', genre: 'ARPG',
    ranks: [],
    roles: ['Barbarian', 'Sorcerer', 'Rogue', 'Druid', 'Necromancer', 'Spiritborn'],
  },
  wow: {
    name: 'World of Warcraft', abbr: 'WoW', bg: '#0d1117', accent: '#00aeff', genre: 'MMO',
    ranks: [],
    roles: ['Tank', 'Healer', 'DPS (Melee)', 'DPS (Ranged)'],
  },
};

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export function getGameData() {
  return Object.entries(GAME_DATA).map(([id, data]) => ({ id, ...data }));
}

export function getGameName(id) {
  return GAME_DATA[id]?.name || id;
}

export function getGameById(id) {
  return GAME_DATA[id] || null;
}

export function getGameRanks(id) {
  return GAME_DATA[id]?.ranks || [];
}

export function getGameRoles(id) {
  return GAME_DATA[id]?.roles || [];
}

export function getSkillLevels() {
  return SKILL_LEVELS;
}