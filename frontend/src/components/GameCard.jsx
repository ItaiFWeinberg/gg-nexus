/**
 * GameCard — Professional game selection with brand colors
 * Large, prominent cards that use the full screen width
 */

const GAME_DATA = {
  lol:       { name: 'League of Legends', abbr: 'LoL',  bg: '#0a1428', accent: '#c8aa6e', genre: 'MOBA' },
  valorant:  { name: 'Valorant',          abbr: 'VAL',  bg: '#0f1923', accent: '#ff4655', genre: 'FPS' },
  tft:       { name: 'TFT',              abbr: 'TFT',  bg: '#1a1040', accent: '#e8b840', genre: 'Auto Battler' },
  minecraft: { name: 'Minecraft',         abbr: 'MC',   bg: '#3b2314', accent: '#62b44b', genre: 'Sandbox' },
  cod:       { name: 'Call of Duty',      abbr: 'COD',  bg: '#1a1a1a', accent: '#ff8c00', genre: 'FPS' },
  apex:      { name: 'Apex Legends',      abbr: 'APX',  bg: '#141414', accent: '#cd3333', genre: 'Battle Royale' },
  cs2:       { name: 'CS2',              abbr: 'CS2',  bg: '#1b2838', accent: '#de9b35', genre: 'FPS' },
  fortnite:  { name: 'Fortnite',         abbr: 'FN',   bg: '#1a1a2e', accent: '#2fc1f0', genre: 'Battle Royale' },
  dota2:     { name: 'Dota 2',           abbr: 'D2',   bg: '#0d0d0d', accent: '#e44444', genre: 'MOBA' },
  ow2:       { name: 'Overwatch 2',      abbr: 'OW2',  bg: '#2a2a40', accent: '#fa9c1e', genre: 'FPS' },
  deadlock:  { name: 'Deadlock',          abbr: 'DL',   bg: '#1a1a2e', accent: '#8b5cf6', genre: 'MOBA Shooter' },
  rl:        { name: 'Rocket League',     abbr: 'RL',   bg: '#0d1117', accent: '#005dff', genre: 'Sports' },
  pubg:      { name: 'PUBG',             abbr: 'PBG',  bg: '#1a1a1a', accent: '#f2a900', genre: 'Battle Royale' },
  elden:     { name: 'Elden Ring',        abbr: 'ER',   bg: '#1a1510', accent: '#c5a55a', genre: 'RPG' },
  diablo:    { name: 'Diablo IV',         abbr: 'D4',   bg: '#0d0d0d', accent: '#cc3333', genre: 'ARPG' },
  wow:       { name: 'World of Warcraft', abbr: 'WoW',  bg: '#0d1117', accent: '#00aeff', genre: 'MMO' },
};

export function getGameData() {
  return Object.entries(GAME_DATA).map(([id, data]) => ({ id, ...data }));
}

export function getGameName(id) {
  return GAME_DATA[id]?.name || id;
}

export default function GameCard({ gameId, selected, onClick }) {
  const game = GAME_DATA[gameId];
  if (!game) return null;

  return (
    <button onClick={onClick}
      className={`relative overflow-hidden rounded-xl transition-all duration-200 w-full group ${
        selected ? 'scale-[1.02] ring-1' : 'hover:scale-[1.01]'
      }`}
      style={{
        background: `linear-gradient(135deg, ${game.bg}, ${game.bg}dd)`,
        ringColor: selected ? game.accent : 'transparent',
        boxShadow: selected ? `0 4px 24px ${game.accent}25, inset 0 0 0 1px ${game.accent}40` : `inset 0 0 0 1px rgba(255,255,255,0.05)`,
      }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-[2px] transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${game.accent}, transparent)`, opacity: selected ? 1 : 0 }} />

      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Brand icon */}
        <div className="w-11 h-11 rounded-lg flex items-center justify-center font-black text-sm tracking-wider shrink-0 transition-all"
          style={{
            background: selected ? `${game.accent}25` : `${game.accent}10`,
            color: game.accent,
            border: `1.5px solid ${selected ? game.accent + '60' : game.accent + '20'}`,
            textShadow: selected ? `0 0 10px ${game.accent}60` : 'none',
          }}>
          {game.abbr}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm truncate transition-colors"
            style={{ color: selected ? game.accent : '#c0c0d0' }}>
            {game.name}
          </p>
          <p className="text-[10px] mt-0.5 transition-colors"
            style={{ color: selected ? `${game.accent}aa` : '#555570' }}>
            {game.genre}
          </p>
        </div>

        {/* Check */}
        {selected && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: game.accent, color: game.bg }}>
            ✓
          </div>
        )}
      </div>
    </button>
  );
}