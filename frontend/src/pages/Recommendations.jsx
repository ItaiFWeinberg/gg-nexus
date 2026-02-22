import { useState, useEffect } from 'react';
import { RiRefreshLine, RiStarLine, RiGamepadLine, RiArrowRightLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecommendations } from '../services/api';
import BotAvatar from '../components/BotAvatar';

function MatchBar({ score }) {
  const color = score >= 90 ? '#00ff88' : score >= 75 ? '#ffd700' : score >= 60 ? '#fa9c1e' : '#7070a0';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-nox-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

export default function Recommendations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const profile = user?.profile || {};
  const games = profile.favorite_games || [];

  const fetchRecs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRecommendations();
      setRecs(data.recommendations || []);
      if (data.error) setError(data.error);
    } catch {
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (games.length > 0) fetchRecs();
    else setLoading(false);
  }, [games.length]);

  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <RiGamepadLine className="text-5xl text-nox-subtle mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Set up your games first</h2>
          <p className="text-nox-muted text-sm mb-4">Add your favorite games in your profile so Nexus can find games you'll love.</p>
          <button onClick={() => navigate('/chat')}
            className="px-6 py-2.5 bg-nox-red hover:bg-nox-red-bright text-white text-sm font-medium rounded-xl transition-all">
            Tell Nexus what you play →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Game <span className="text-nox-red">Recommendations</span></h1>
          <p className="text-nox-muted text-sm">AI-picked games based on your profile — not generic top-10 lists</p>
        </div>
        <button onClick={fetchRecs} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-nox-card border border-nox-border rounded-xl text-sm text-nox-muted hover:text-white hover:border-nox-red/30 transition-all disabled:opacity-40">
          <RiRefreshLine className={loading ? 'animate-spin' : ''} /> New picks
        </button>
      </div>

      {/* Based on your games */}
      <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3">
        <BotAvatar mood="excited" size={36} />
        <p className="text-sm text-nox-text">
          Based on your love for <span className="text-white font-medium">{games.slice(0, 3).join(', ')}</span>
          {games.length > 3 ? ` and ${games.length - 3} more` : ''}, here's what I think you'd enjoy:
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-nox-card border border-nox-border rounded-2xl p-5 animate-pulse">
              <div className="w-32 h-4 bg-nox-hover rounded mb-3" />
              <div className="w-full h-3 bg-nox-hover rounded mb-2" />
              <div className="w-2/3 h-3 bg-nox-hover rounded mb-3" />
              <div className="w-full h-1.5 bg-nox-hover rounded" />
            </div>
          ))}
        </div>
      ) : error && recs.length === 0 ? (
        <div className="bg-nox-card border border-nox-border rounded-2xl p-8 text-center">
          <p className="text-nox-muted">{error}</p>
          <button onClick={fetchRecs} className="mt-3 text-nox-red text-sm hover:underline">Try again</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recs.map((rec, i) => (
            <div key={i} className="bg-nox-card border border-nox-border rounded-2xl p-5 hover:border-nox-red/20 transition-all"
              style={{ animation: `slide-up 0.4s ease-out ${i * 0.08}s both` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{rec.name}</h3>
                  {rec.because_of && (
                    <p className="text-[10px] text-nox-red mt-0.5">Because you play {rec.because_of}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-nox-hover">
                  <RiStarLine className="text-nox-gold text-xs" />
                  <span className="text-xs font-bold text-nox-gold">{rec.match_score || '?'}</span>
                </div>
              </div>

              <p className="text-sm text-nox-muted mb-3 leading-relaxed">{rec.reason}</p>

              {rec.match_score && <MatchBar score={rec.match_score} />}

              <button onClick={() => navigate('/chat')}
                className="flex items-center gap-1 mt-3 text-xs text-nox-red hover:text-nox-red-bright transition-colors">
                Ask Nexus about this game <RiArrowRightLine />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}