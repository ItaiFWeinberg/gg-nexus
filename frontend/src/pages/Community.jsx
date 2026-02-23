import { useState, useEffect } from 'react';
import { RiTeamLine, RiSendPlaneFill, RiRefreshLine, RiMapPinLine, RiTrophyLine, RiSwordLine, RiTimeLine } from 'react-icons/ri';
import { useAuth } from '../context/Authcontext';
import { getLfgPosts, createLfgPost } from '../services/api';
import BotAvatar from '../components/BotAvatar';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function LfgCard({ post }) {
  return (
    <div className="bg-nox-card border border-nox-border rounded-xl p-4 hover:border-nox-red/20 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-nox-hover flex items-center justify-center text-xs font-bold text-nox-red">
            {post.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{post.username}</p>
            <p className="text-[10px] text-nox-subtle flex items-center gap-1">
              <RiTimeLine /> {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-nox-red/10 border border-nox-red/20 rounded-lg text-[11px] font-medium text-nox-red">
          {post.game}
        </span>
      </div>

      <p className="text-sm text-nox-text mb-3">{post.message}</p>

      <div className="flex flex-wrap gap-2">
        {post.rank && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-nox-hover rounded text-[10px] text-nox-muted">
            <RiTrophyLine className="text-nox-gold" /> {post.rank}
          </span>
        )}
        {post.role && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-nox-hover rounded text-[10px] text-nox-muted">
            <RiSwordLine className="text-nox-blue" /> {post.role}
          </span>
        )}
        {post.region && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-nox-hover rounded text-[10px] text-nox-muted">
            <RiMapPinLine /> {post.region}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');
  const [message, setMessage] = useState('');

  const profile = user?.profile || {};
  const games = profile.favorite_games || [];

  const fetchPosts = async () => {
    try {
      const data = await getLfgPosts();
      setPosts(data.posts || []);
    } catch { // ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async () => {
    if (!selectedGame || !message.trim()) return;
    setPosting(true);
    try {
      const data = await createLfgPost(selectedGame, message.trim());
      if (data.post) setPosts(prev => [data.post, ...prev]);
      setMessage('');
      setShowForm(false);
    } catch { // ignored
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            <span className="text-nox-red">Community</span> Hub
          </h1>
          <p className="text-nox-muted text-sm">Find teammates, share strats, connect with gamers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPosts}
            className="p-2.5 bg-nox-card border border-nox-border rounded-xl text-nox-muted hover:text-white transition-all">
            <RiRefreshLine />
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-nox-red hover:bg-nox-red-bright text-white text-sm font-medium rounded-xl transition-all">
            <RiTeamLine /> LFG Post
          </button>
        </div>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="bg-nox-card border border-nox-border rounded-2xl p-5 mb-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <RiTeamLine className="text-nox-red" /> Looking for Group
          </h3>

          <div className="mb-4">
            <label className="block text-[10px] text-nox-muted uppercase tracking-widest mb-2">Game</label>
            <div className="flex flex-wrap gap-2">
              {games.map((game) => (
                <button key={game} onClick={() => setSelectedGame(game)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedGame === game
                      ? 'bg-nox-red/15 border border-nox-red/40 text-white'
                      : 'bg-nox-hover border border-nox-border text-nox-muted hover:text-white'
                  }`}>
                  {game}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] text-nox-muted uppercase tracking-widest mb-2">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Looking for a duo partner to climb ranked this weekend..."
              rows={3}
              className="w-full bg-nox-bg border border-nox-border rounded-xl px-4 py-3 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors resize-none" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-nox-border text-nox-muted text-sm rounded-lg hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={handlePost} disabled={!selectedGame || !message.trim() || posting}
              className="flex items-center gap-2 px-4 py-2 bg-nox-red hover:bg-nox-red-bright disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-all">
              <RiSendPlaneFill /> {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Posts feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-nox-card border border-nox-border rounded-xl p-5 animate-pulse">
              <div className="w-32 h-4 bg-nox-hover rounded mb-3" />
              <div className="w-full h-3 bg-nox-hover rounded mb-2" />
              <div className="w-2/3 h-3 bg-nox-hover rounded" />
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <LfgCard key={post._id || i} post={post} />
          ))}
        </div>
      ) : (
        <div className="bg-nox-card border border-nox-border rounded-2xl p-10 text-center">
          <BotAvatar mood="curious" size={48} />
          <h3 className="text-lg font-semibold text-white mt-4 mb-2">No posts yet</h3>
          <p className="text-sm text-nox-muted mb-4">Be the first to find teammates!</p>
          <button onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-nox-red hover:bg-nox-red-bright text-white text-sm font-medium rounded-xl transition-all">
            Create an LFG Post
          </button>
        </div>
      )}
    </div>
  );
}