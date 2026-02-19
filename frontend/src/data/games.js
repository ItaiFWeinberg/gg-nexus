const GAME_DATA = {
  lol:       { name: "League of Legends", abbr: "LoL", bg: "#0a1428", accent: "#c8aa6e", genre: "MOBA" },
  valorant:  { name: "Valorant",          abbr: "VAL", bg: "#0f1923", accent: "#ff4655", genre: "FPS" },
  tft:       { name: "TFT",               abbr: "TFT", bg: "#1a1040", accent: "#e8b840", genre: "Auto Battler" },
  minecraft: { name: "Minecraft",         abbr: "MC",  bg: "#3b2314", accent: "#62b44b", genre: "Sandbox" },
  cod:       { name: "Call of Duty",      abbr: "COD", bg: "#1a1a1a", accent: "#ff8c00", genre: "FPS" },
  apex:      { name: "Apex Legends",      abbr: "APX", bg: "#141414", accent: "#cd3333", genre: "Battle Royale" },
  cs2:       { name: "CS2",               abbr: "CS2", bg: "#1b2838", accent: "#de9b35", genre: "FPS" },
  fortnite:  { name: "Fortnite",          abbr: "FN",  bg: "#1a1a2e", accent: "#2fc1f0", genre: "Battle Royale" },
  dota2:     { name: "Dota 2",            abbr: "D2",  bg: "#0d0d0d", accent: "#e44444", genre: "MOBA" },
  ow2:       { name: "Overwatch 2",       abbr: "OW2", bg: "#2a2a40", accent: "#fa9c1e", genre: "FPS" },
  deadlock:  { name: "Deadlock",          abbr: "DL",  bg: "#1a1a2e", accent: "#8b5cf6", genre: "MOBA Shooter" },
  rl:        { name: "Rocket League",     abbr: "RL",  bg: "#0d1117", accent: "#005dff", genre: "Sports" },
  pubg:      { name: "PUBG",              abbr: "PBG", bg: "#1a1a1a", accent: "#f2a900", genre: "Battle Royale" },
  elden:     { name: "Elden Ring",        abbr: "ER",  bg: "#1a1510", accent: "#c5a55a", genre: "RPG" },
  diablo:    { name: "Diablo IV",         abbr: "D4",  bg: "#0d0d0d", accent: "#cc3333", genre: "ARPG" },
  wow:       { name: "World of Warcraft", abbr: "WoW", bg: "#0d1117", accent: "#00aeff", genre: "MMO" },
};

export function getGameData() {
  return Object.entries(GAME_DATA).map(([id, data]) => ({ id, ...data }));
}

export function getGameName(id) {
  return GAME_DATA[id]?.name || id;
}

export function getGameById(id) {
  return GAME_DATA[id] || null;
}
