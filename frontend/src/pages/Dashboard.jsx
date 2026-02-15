import { useNavigate } from 'react-router-dom';
import { RiChatSmile2Line, RiGamepadLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, <span className="text-nox-red">{user?.username || 'Player'}</span>
        </h1>
        <p className="text-nox-muted">Your gaming command center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-nox-card border border-nox-border rounded-2xl p-5">
          <p className="text-nox-muted text-xs uppercase tracking-wider mb-2">Favorite Games</p>
          <p className="text-2xl font-bold text-nox-red">{user?.profile?.favorite_games?.length || 0}</p>
          <p className="text-xs text-nox-subtle mt-1">{user?.profile?.favorite_games?.join(', ') || 'Set up in profile'}</p>
        </div>
        <div className="bg-nox-card border border-nox-border rounded-2xl p-5">
          <p className="text-nox-muted text-xs uppercase tracking-wider mb-2">AI Sessions</p>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-nox-subtle mt-1">Start chatting!</p>
        </div>
        <div className="bg-nox-card border border-nox-border rounded-2xl p-5">
          <p className="text-nox-muted text-xs uppercase tracking-wider mb-2">Status</p>
          <p className="text-2xl font-bold text-nox-green">Online</p>
          <p className="text-xs text-nox-subtle mt-1">All systems running</p>
        </div>
      </div>

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

        <div className="bg-nox-card border border-nox-border rounded-2xl p-6 opacity-60">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-nox-hover border border-nox-border flex items-center justify-center">
              <RiGamepadLine className="text-nox-muted text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Game Recommendations</h2>
              <p className="text-sm text-nox-muted">AI-powered game discovery</p>
              <span className="inline-block mt-3 text-xs text-nox-subtle font-medium uppercase tracking-wider">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}