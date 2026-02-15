import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import NoxusLogo from '../components/NoxusLogo';
import BotAvatar from '../components/BotAvatar';
import ParticleBackground from '../components/ParticleBackground';
import GameCard, { getGameData, getGameName } from '../components/GameCard';
import { RiEyeLine, RiEyeOffLine, RiAddLine, RiCloseLine } from 'react-icons/ri';

const GAMES_LIST = getGameData();

const PLAYSTYLES = [
  { id: 'competitive', label: 'Competitive', desc: 'I play to win and climb ranks', icon: '🏆' },
  { id: 'casual', label: 'Casual', desc: 'I play to relax and have fun', icon: '🎮' },
  { id: 'explorer', label: 'Explorer', desc: 'I love discovering new games', icon: '🗺️' },
  { id: 'social', label: 'Social', desc: 'I mostly play with friends', icon: '👥' },
];

const GOALS = [
  { id: 'rank', label: 'Climb Ranks', icon: '📈' },
  { id: 'newgames', label: 'Find Games', icon: '🔍' },
  { id: 'improve', label: 'Get Better', icon: '💪' },
  { id: 'builds', label: 'Best Builds', icon: '📋' },
  { id: 'fun', label: 'Have Fun', icon: '😄' },
  { id: 'community', label: 'Find Team', icon: '🤝' },
];

export default function Signup() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [customGames, setCustomGames] = useState([]);
  const [customGameInput, setCustomGameInput] = useState('');
  const [selectedPlaystyle, setSelectedPlaystyle] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedCreds, setSavedCreds] = useState(null);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const toggleGame = (id) => setSelectedGames(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  const toggleGoal = (id) => setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

  const addCustomGame = () => {
    const game = customGameInput.trim();
    if (game && !customGames.includes(game)) {
      setCustomGames(prev => [...prev, game]);
      setCustomGameInput('');
    }
  };

  const removeCustomGame = (game) => setCustomGames(prev => prev.filter(g => g !== game));

  const totalGames = selectedGames.length + customGames.length;

  const handleStep1 = () => {
    setError('');
    if (username.length < 3) return setError('Username must be at least 3 characters');
    if (!email.includes('@')) return setError('Please enter a valid email');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setSavedCreds({ username, email, password });
    setStep(2);
  };

  const handleComplete = async () => {
    if (!savedCreds) return;
    setIsLoading(true);
    setError('');
    try {
      await signup(savedCreds.username, savedCreds.email, savedCreds.password);
      const knownGames = selectedGames.map(id => getGameName(id));
      const allGames = [...knownGames, ...customGames];
      await updateProfile({
        favorite_games: allGames,
        playstyle: [selectedPlaystyle],
        goals: selectedGoals,
        platforms: ['PC'],
      });
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const botMood = step === 1 ? 'idle' : step === 2 ? 'excited' : 'happy';
  const botSpeech = step === 1 ? "Let's get you set up." : step === 2 ? "Pick everything you play!" : "Last step — how do you play?";

  return (
    <div className="min-h-screen bg-nox-bg relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link to="/landing"><NoxusLogo size={36} /></Link>
          <BotAvatar mood={botMood} size={50} />
          <div className="glass rounded-lg px-3 py-1.5">
            <p className="text-[11px] text-nox-muted">{botSpeech}</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 mb-6">
          {[
            { n: 1, label: 'Account' },
            { n: 2, label: 'Games' },
            { n: 3, label: 'Style' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                s.n === step ? 'bg-nox-red text-white' : s.n < step ? 'bg-nox-red/20 text-nox-red' : 'bg-nox-border/50 text-nox-subtle'
              }`}>
                <span className="font-bold">{s.n}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className={`w-6 h-px mx-1 ${s.n < step ? 'bg-nox-red/40' : 'bg-nox-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Account */}
        {step === 1 && (
          <div className="w-full max-w-md animate-slide-up">
            <h1 className="font-gaming text-2xl text-white text-center mb-1 tracking-wider">CREATE ACCOUNT</h1>
            <p className="text-nox-muted text-center text-sm mb-6">Your credentials</p>

            {error && (
              <div className="bg-nox-red/10 border border-nox-red/30 rounded-lg px-4 py-2.5 mb-4">
                <p className="text-nox-red text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-nox-muted uppercase tracking-widest mb-2">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full glass rounded-lg px-4 py-3 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-nox-muted uppercase tracking-widest mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full glass rounded-lg px-4 py-3 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-nox-muted uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full glass rounded-lg px-4 py-3 pr-10 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-nox-muted hover:text-white transition-colors">
                    {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-nox-muted uppercase tracking-widest mb-2">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
                    className="w-full glass rounded-lg px-4 py-3 pr-10 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-nox-muted hover:text-white transition-colors">
                    {showConfirm ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
              </div>
              <button onClick={handleStep1}
                className="w-full py-3 bg-nox-red hover:bg-nox-red-bright text-white font-gaming tracking-widest rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,45,85,0.3)]">
                NEXT →
              </button>
            </div>
            <p className="text-center text-sm text-nox-muted mt-5">
              Have an account? <Link to="/login" className="text-nox-red hover:text-nox-red-bright">Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 2: Games — FULL WIDTH */}
        {step === 2 && (
          <div className="w-full max-w-3xl animate-slide-up">
            <h1 className="font-gaming text-2xl text-white text-center mb-1 tracking-wider">YOUR GAMES</h1>
            <p className="text-nox-muted text-center text-sm mb-6">Select the games you play</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {GAMES_LIST.map((game) => (
                <GameCard
                  key={game.id}
                  gameId={game.id}
                  selected={selectedGames.includes(game.id)}
                  onClick={() => toggleGame(game.id)}
                />
              ))}
            </div>

            {/* Custom games */}
            <div className="glass rounded-xl p-4 mb-4">
              <p className="text-xs text-nox-muted uppercase tracking-widest mb-3">Don't see your game? Add it:</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customGameInput}
                  onChange={(e) => setCustomGameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomGame()}
                  placeholder="Type a game name..."
                  className="flex-1 bg-nox-bg border border-nox-border rounded-lg px-3 py-2 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors"
                />
                <button onClick={addCustomGame} disabled={!customGameInput.trim()}
                  className="px-4 py-2 bg-nox-red/20 border border-nox-red/30 text-nox-red rounded-lg hover:bg-nox-red/30 disabled:opacity-30 transition-all">
                  <RiAddLine />
                </button>
              </div>
              {customGames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customGames.map((game) => (
                    <span key={game} className="flex items-center gap-1.5 px-3 py-1.5 bg-nox-red-glow border border-nox-red/30 rounded-lg text-xs text-nox-red">
                      {game}
                      <button onClick={() => removeCustomGame(game)} className="hover:text-white"><RiCloseLine /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-nox-subtle">
                {totalGames} game{totalGames !== 1 ? 's' : ''} selected
                {totalGames === 0 && ' — pick at least 1'}
              </p>
            </div>

            <div className="flex gap-3 max-w-md mx-auto">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-nox-border text-nox-muted rounded-lg hover:text-white transition-colors">← Back</button>
              <button onClick={() => totalGames > 0 && setStep(3)} disabled={totalGames === 0}
                className="flex-1 py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-30 text-white font-gaming tracking-widest rounded-lg transition-all">
                NEXT →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Style — WIDER */}
        {step === 3 && (
          <div className="w-full max-w-2xl animate-slide-up">
            <h1 className="font-gaming text-2xl text-white text-center mb-1 tracking-wider">YOUR STYLE</h1>
            <p className="text-nox-muted text-center text-sm mb-6">How do you play?</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {PLAYSTYLES.map((style) => (
                <button key={style.id} onClick={() => setSelectedPlaystyle(style.id)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedPlaystyle === style.id
                      ? 'bg-nox-red-glow-strong border border-nox-red/40 text-white'
                      : 'glass text-nox-muted hover:text-white hover:border-nox-red/20'
                  }`}>
                  <span className="text-2xl block mb-2">{style.icon}</span>
                  <span className="font-semibold text-sm block">{style.label}</span>
                  <span className="text-[11px] text-nox-subtle block mt-1">{style.desc}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-nox-muted uppercase tracking-widest mb-3">What do you want from Nexus?</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              {GOALS.map((goal) => (
                <button key={goal.id} onClick={() => toggleGoal(goal.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedGoals.includes(goal.id)
                      ? 'bg-nox-red-glow-strong border border-nox-red/40 text-white'
                      : 'glass text-nox-muted hover:text-white hover:border-nox-red/20'
                  }`}>
                  <span className="text-xl block mb-1">{goal.icon}</span>
                  <span className="text-[11px] font-medium">{goal.label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-nox-red/10 border border-nox-red/30 rounded-lg px-4 py-2.5 mb-4">
                <p className="text-nox-red text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 max-w-md mx-auto">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-nox-border text-nox-muted rounded-lg hover:text-white transition-colors">← Back</button>
              <button onClick={handleComplete} disabled={isLoading}
                className="flex-1 py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-30 text-white font-gaming tracking-widest rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,45,85,0.3)]">
                {isLoading ? 'CREATING...' : 'ENTER NEXUS →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}