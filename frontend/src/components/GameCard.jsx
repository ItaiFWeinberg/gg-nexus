import { getGameById } from './gameData';

export default function GameCard({ gameId, selected, onClick }) {
  const game = getGameById(gameId);
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
      <div className="absolute top-0 left-0 w-full h-0.5 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${game.accent}, transparent)`, opacity: selected ? 1 : 0 }} />

      <div className="flex items-center gap-3 px-4 py-3.5">
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