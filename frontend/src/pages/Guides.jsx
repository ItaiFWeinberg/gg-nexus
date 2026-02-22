import { useState } from 'react';
import { RiBookOpenLine, RiSwordLine, RiArrowUpLine, RiLightbulbLine, RiMagicLine, RiGamepadLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { generateGuide } from '../services/api';
import BotAvatar from '../components/BotAvatar';

const GUIDE_TOPICS = [
  { id: 'meta', label: 'Current Meta', icon: <RiMagicLine />, desc: 'What\'s strong right now' },
  { id: 'climbing', label: 'Rank Climbing', icon: <RiArrowUpLine />, desc: 'How to climb efficiently' },
  { id: 'role', label: 'Your Role Guide', icon: <RiSwordLine />, desc: 'Tailored to your main' },
  { id: 'advanced', label: 'Advanced Tips', icon: <RiLightbulbLine />, desc: 'Things most players miss' },
  { id: 'beginner', label: 'Getting Started', icon: <RiBookOpenLine />, desc: 'Fundamentals breakdown' },
  { id: 'general', label: 'Full Strategy', icon: <RiGamepadLine />, desc: 'Comprehensive overview' },
];

function MarkdownRenderer({ text }) {
  // Simple markdown: ## headers, **bold**, *italic*, - lists
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold text-white mt-4 mb-1">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-semibold text-nox-text mt-3 mb-1">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="text-nox-red mt-0.5">•</span>
              <span className="text-sm text-nox-text leading-relaxed">{formatInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm text-nox-text leading-relaxed">{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text) {
  // Bold **text** and inline code `text`
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    let nextMatch = null;
    let type = null;

    if (boldMatch && (!codeMatch || boldMatch.index <= codeMatch.index)) {
      nextMatch = boldMatch;
      type = 'bold';
    } else if (codeMatch) {
      nextMatch = codeMatch;
      type = 'code';
    }

    if (nextMatch) {
      if (nextMatch.index > 0) parts.push(remaining.slice(0, nextMatch.index));
      if (type === 'bold') {
        parts.push(<strong key={key++} className="text-white font-semibold">{nextMatch[1]}</strong>);
      } else {
        parts.push(<code key={key++} className="text-nox-red bg-nox-hover px-1 py-0.5 rounded text-xs">{nextMatch[1]}</code>);
      }
      remaining = remaining.slice(nextMatch.index + nextMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  return parts;
}

export default function Guides() {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const profile = user?.profile || {};
  const games = profile.favorite_games || [];

  const handleGenerate = async () => {
    if (!selectedGame) return;
    setLoading(true);
    setError('');
    setGuide(null);
    try {
      const data = await generateGuide(selectedGame, selectedTopic || 'general');
      setGuide(data);
    } catch {
      setError('Failed to generate guide. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-1">Strategy <span className="text-nox-red">Hub</span></h1>
      <p className="text-nox-muted text-sm mb-8">Personalized guides tailored to your rank, role, and playstyle</p>

      {/* Game selector */}
      <div className="mb-6">
        <label className="block text-xs text-nox-muted uppercase tracking-widest mb-3">Pick your game</label>
        <div className="flex flex-wrap gap-2">
          {games.map((game) => {
            const rank = profile.ranks?.[game];
            const role = profile.main_roles?.[game];
            return (
              <button key={game} onClick={() => { setSelectedGame(game); setGuide(null); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedGame === game
                    ? 'bg-nox-red/15 border border-nox-red/40 text-white'
                    : 'bg-nox-card border border-nox-border text-nox-muted hover:text-white hover:border-nox-red/20'
                }`}>
                <span>{game}</span>
                {rank && <span className="ml-1.5 text-[10px] text-nox-red">({rank})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic selector */}
      {selectedGame && (
        <div className="mb-6 animate-slide-up">
          <label className="block text-xs text-nox-muted uppercase tracking-widest mb-3">What do you need?</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {GUIDE_TOPICS.map((topic) => (
              <button key={topic.id} onClick={() => setSelectedTopic(topic.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedTopic === topic.id
                    ? 'bg-nox-red/15 border border-nox-red/40'
                    : 'bg-nox-card border border-nox-border hover:border-nox-red/20'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm ${selectedTopic === topic.id ? 'text-nox-red' : 'text-nox-muted'}`}>
                    {topic.icon}
                  </span>
                  <span className={`text-sm font-medium ${selectedTopic === topic.id ? 'text-white' : 'text-nox-muted'}`}>
                    {topic.label}
                  </span>
                </div>
                <p className="text-[11px] text-nox-subtle">{topic.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      {selectedGame && (
        <button onClick={handleGenerate} disabled={loading}
          className="mb-8 px-6 py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-40 text-white font-gaming tracking-widest rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,45,85,0.3)]">
          {loading ? 'GENERATING...' : `GENERATE ${selectedTopic ? GUIDE_TOPICS.find(t => t.id === selectedTopic)?.label.toUpperCase() || 'GUIDE' : 'GUIDE'}`}
        </button>
      )}

      {error && (
        <div className="bg-nox-red/10 border border-nox-red/30 rounded-xl p-4 mb-4">
          <p className="text-nox-red text-sm">{error}</p>
        </div>
      )}

      {/* Guide output */}
      {guide && (
        <div className="bg-nox-card border border-nox-border rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-nox-border">
            <BotAvatar mood="proud" size={36} />
            <div>
              <h3 className="text-base font-semibold text-white">{guide.game} — {GUIDE_TOPICS.find(t => t.id === guide.topic)?.label || 'Strategy Guide'}</h3>
              <p className="text-[10px] text-nox-subtle">Tailored for: {guide.tailored_for}</p>
            </div>
          </div>
          <MarkdownRenderer text={guide.guide} />
        </div>
      )}

      {/* Empty state */}
      {!selectedGame && games.length > 0 && (
        <div className="bg-nox-card border border-nox-border rounded-2xl p-10 text-center">
          <BotAvatar mood="curious" size={48} />
          <p className="text-nox-muted mt-3">Pick a game above to generate a personalized guide</p>
        </div>
      )}

      {games.length === 0 && (
        <div className="bg-nox-card border border-nox-border rounded-2xl p-10 text-center">
          <RiGamepadLine className="text-4xl text-nox-subtle mx-auto mb-3" />
          <p className="text-nox-muted">Add your games during signup to get personalized guides</p>
        </div>
      )}
    </div>
  );
}