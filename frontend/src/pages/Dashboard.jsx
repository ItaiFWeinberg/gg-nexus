import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiChatSmile2Line, RiRefreshLine, RiArrowRightLine, RiLightbulbLine, RiTrophyLine, RiSwordLine, RiStarLine, RiGamepadLine } from 'react-icons/ri';
import { useAuth } from '../context/Authcontext';
import { getDashboardGames, getDashboardTip } from '../services/api';
import BotAvatar from '../components/BotAvatar';

const GAME_COLORS = {
  'League of Legends': '#c8aa6e', 'Valorant': '#ff4655', 'TFT': '#e8b840',
  'Minecraft': '#62b44b', 'Call of Duty': '#ff8c00', 'Apex Legends': '#cd3333',
  'CS2': '#de9b35', 'Fortnite': '#2fc1f0', 'Dota 2': '#e44444',
  'Overwatch 2': '#fa9c1e', 'Deadlock': '#8b5cf6', 'Rocket League': '#005dff',
  'PUBG': '#f2a900', 'Elden Ring': '#c5a55a', 'Diablo IV': '#cc3333',
  'World of Warcraft': '#00aeff',
};

function getAccent(name) {
  return GAME_COLORS[name] || '#ff2d55';
}

function GameCard({ game, onClick }) {
  const accent = getAccent(game.name);
  const meta = game.meta || {};
  const patch = meta.patch || meta.season || null;
  const tips = meta.tips || [];
  const topTier = meta.top_tier || {};
  const summary = meta.meta_summary || null;
  const hasError = !!meta.error;

  return (
    <button onClick={onClick}
      className="group bg-nox-card border border-nox-border rounded-2xl p-5 text-left hover:border-opacity-60 transition-all duration-300 cursor-pointer w-full"
      style={{ '--accent': accent, borderColor: `${accent}15` }}>

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
            style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
            {game.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-opacity-90">{game.name}</h3>
            {patch && <p className="text-[10px] text-nox-subtle">Patch {patch}</p>}
          </div>
        </div>
        <RiArrowRightLine className="text-nox-subtle group-hover:translate-x-0.5 transition-transform" style={{ color: `${accent}60` }} />
      </div>

      {/* User stats bar */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {game.rank && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
            style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}>
            <RiTrophyLine className="text-[9px]" /> {game.rank}
          </span>
        )}
        {game.role && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
            style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}>
            <RiSwordLine className="text-[9px]" /> {game.role}
          </span>
        )}
        {game.skill && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
            style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}>
            <RiStarLine className="text-[9px]" /> {game.skill}
          </span>
        )}
      </div>

      {hasError ? (
        <p className="text-xs text-nox-subtle italic">Loading game data...</p>
      ) : (
        <>
          {summary && (
            <p className="text-xs text-nox-muted mb-2 line-clamp-2">{summary}</p>
          )}

          {Object.keys(topTier).length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-nox-subtle uppercase tracking-widest mb-1">Top Tier</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(topTier).slice(0, 3).map(([category, items]) => (
                  <span key={category} className="text-[10px] px-1.5 py-0.5 rounded bg-nox-hover text-nox-muted">
                    {Array.isArray(items) ? items.slice(0, 2).join(', ') : String(items).substring(0, 30)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tips.length > 0 && (
            <div className="mt-2 pt-2 border-t border-nox-border/50">
              <p className="text-[10px] text-nox-subtle uppercase tracking-widest mb-1">Quick Tip</p>
              <p className="text-[11px] text-nox-muted leading-relaxed">{tips[0]}</p>
            </div>
          )}
        </>
      )}
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(true);
  const [tipLoading, setTipLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataFetched = useRef(false);

  const profile = user?.profile || {};
  const favoriteGames = profile.favorite_games || [];
  const playstyle = (profile.playstyle || [])[0] || '';
  const goals = profile.goals || [];

  const fetchData = async (showRefresh) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await getDashboardGames();
      setGames(data.games || []);
    } catch (err) {
      console.error('Failed to fetch dashboard games:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTip = async () => {
    setTipLoading(true);
    try {
      const data = await getDashboardTip();
      setTip(data.tip || '');
    } catch {
      setTip('Focus on one game at a time to improve faster!');
    } finally {
      setTipLoading(false);
    }
  };

  useEffect(() => {
    if (dataFetched.current) return;
    if (favoriteGames.length > 0) {
      dataFetched.current = true;
      fetchData(false);
      fetchTip();
    } else {
      setLoading(false);
      setTipLoading(false);
    }
  }, [favoriteGames.length]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, <span className="text-nox-red">{user?.username || 'Player'}</span>
          </h1>
          <p className="text-nox-muted">
            {playstyle === 'competitive' && 'Ready to climb? '}
            {playstyle === 'casual' && 'Time to relax and play. '}
            {playstyle === 'explorer' && 'Discover something new today. '}
            {playstyle === 'social' && 'Squad up and dominate. '}
            Your gaming command center
          </p>
        </div>
        {favoriteGames.length > 0 && (
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-nox-card border border-nox-border rounded-xl text-sm text-nox-muted hover:text-white hover:border-nox-red/30 transition-all disabled:opacity-40">
            <RiRefreshLine className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-nox-card border border-nox-border rounded-2xl p-4">
          <p className="text-nox-muted text-[10px] uppercase tracking-wider mb-1">Games</p>
          <p className="text-2xl font-bold text-nox-red">{favoriteGames.length}</p>
        </div>
        <div className="bg-nox-card border border-nox-border rounded-2xl p-4">
          <p className="text-nox-muted text-[10px] uppercase tracking-wider mb-1">Ranked In</p>
          <p className="text-2xl font-bold text-white">{Object.keys(profile.ranks || {}).length}</p>
        </div>
        <div className="bg-nox-card border border-nox-border rounded-2xl p-4">
          <p className="text-nox-muted text-[10px] uppercase tracking-wider mb-1">Goals</p>
          <p className="text-2xl font-bold text-white">{goals.length}</p>
        </div>
        <div className="bg-nox-card border border-nox-border rounded-2xl p-4">
          <p className="text-nox-muted text-[10px] uppercase tracking-wider mb-1">Status</p>
          <p className="text-2xl font-bold text-green-400">Online</p>
        </div>
      </div>

      {/* Nexus Tip */}
      <div className="bg-nox-card border border-nox-red/15 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-4">
          <BotAvatar mood="curious" size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <RiLightbulbLine className="text-nox-red" />
              <p className="text-xs text-nox-muted uppercase tracking-wider font-medium">Nexus Says</p>
            </div>
            {tipLoading ? (
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-nox-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-nox-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-nox-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <p className="text-sm text-nox-text leading-relaxed">{tip}</p>
            )}
          </div>
        </div>
      </div>

      {/* Game Cards */}
      {favoriteGames.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Games</h2>
            <span className="text-xs text-nox-subtle">Live data • Auto-refreshes</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {favoriteGames.slice(0, 4).map((name, i) => (
                <div key={i} className="bg-nox-card border border-nox-border rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-nox-hover" />
                    <div>
                      <div className="w-24 h-3 bg-nox-hover rounded mb-1" />
                      <div className="w-16 h-2 bg-nox-hover rounded" />
                    </div>
                  </div>
                  <div className="w-full h-2 bg-nox-hover rounded mb-2" />
                  <div className="w-3/4 h-2 bg-nox-hover rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {games.map((game) => (
                <GameCard key={game.name} game={game}
                  onClick={() => navigate('/chat')} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-nox-card border border-nox-border rounded-2xl p-8 text-center mb-8">
          <RiGamepadLine className="text-4xl text-nox-subtle mx-auto mb-3" />
          <p className="text-nox-muted mb-2">No games set up yet</p>
          <p className="text-xs text-nox-subtle">Head to chat and tell Nexus what you play!</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => navigate('/chat')}
          className="group bg-nox-card border border-nox-border rounded-2xl p-6 text-left hover:border-nox-red/40 hover:bg-nox-red-glow transition-all duration-300 cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-nox-red-glow border border-nox-red/20 flex items-center justify-center group-hover:border-nox-red/40 transition-colors">
              <RiChatSmile2Line className="text-nox-red text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Chat with Nexus</h2>
              <p className="text-sm text-nox-muted">Get personalized advice, recs, and coaching</p>
              <span className="inline-block mt-3 text-xs text-nox-red font-medium uppercase tracking-wider group-hover:tracking-[4px] transition-all">
                Launch →
              </span>
            </div>
          </div>
        </button>

        <div className="bg-nox-card border border-nox-border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-nox-hover border border-nox-border flex items-center justify-center">
              <RiTrophyLine className="text-nox-muted text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Your Ranks</h2>
              {Object.keys(profile.ranks || {}).length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(profile.ranks).map(([game, rank]) => (
                    <span key={game} className="text-xs px-2.5 py-1 rounded-lg bg-nox-hover border border-nox-border text-nox-muted">
                      {game}: <span className="text-white font-medium">{rank}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-nox-muted">Set your ranks during signup to track progress</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}