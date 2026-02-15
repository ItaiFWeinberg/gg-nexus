import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import NoxusLogo from '../components/NoxusLogo';
import BotAvatar from '../components/BotAvatar';
import ParticleBackground from '../components/ParticleBackground';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

const GAMES_LIST = [
  { id: 'lol', name: 'League of Legends', icon: '⚔️' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'tft', name: 'TFT', icon: '♟️' },
  { id: 'minecraft', name: 'Minecraft', icon: '⛏️' },
  { id: 'cod', name: 'Call of Duty', icon: '🎯' },
  { id: 'apex', name: 'Apex Legends', icon: '🏆' },
  { id: 'cs2', name: 'CS2', icon: '💣' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️' },
  { id: 'dota2', name: 'Dota 2', icon: '🗡️' },
  { id: 'ow2', name: 'Overwatch 2', icon: '🛡️' },
  { id: 'deadlock', name: 'Deadlock', icon: '🔒' },
  { id: 'rl', name: 'Rocket League', icon: '🚗' },
];

const PLAYSTYLES = [
  { id: 'competitive', label: 'Competitive', desc: 'I play to win and climb', icon: '🏆' },
  { id: 'casual', label: 'Casual', desc: 'I play to relax', icon: '🎮' },
  { id: 'explorer', label: 'Explorer', desc: 'I love new games', icon: '🗺️' },
  { id: 'social', label: 'Social', desc: 'I play with friends', icon: '👥' },
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
  const [selectedPlaystyle, setSelectedPlaystyle] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Store credentials for deferred signup
  const [savedCreds, setSavedCreds] = useState(null);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const toggleGame = (id) => setSelectedGames(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  const toggleGoal = (id) => setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);

  const handleStep1 = () => {
    setError('');
    if (username.length < 3) return setError('Username must be at least 3 characters');
    if (!email.includes('@')) return setError('Please enter a valid email');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    // Save credentials but DON'T sign up yet — wait for onboarding
    setSavedCreds({ username, email, password });
    setStep(2);
  };

  const handleComplete = async () => {
    if (!savedCreds) return;
    setIsLoading(true);
    setError('');

    try {
      // NOW create the account
      await signup(savedCreds.username, savedCreds.email, savedCreds.password);

      // Save preferences to profile
      const gameNames = GAMES_LIST.filter(g => selectedGames.includes(g.id)).map(g => g.name);
      await updateProfile({
        favorite_games: gameNames,
        playstyle: [selectedPlaystyle],
        goals: selectedGoals,
        platforms: ['PC'],
      });

      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
      setStep(1); // Go back to fix
    } finally {
      setIsLoading(false);
    }
  };

  const botMood = step === 1 ? 'idle' : step === 2 ? 'excited' : 'happy';

  return (
    <div className="min-h-screen bg-nox-bg relative overflow-hidden flex items-center justify-center px-6">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-3">
          <Link to="/landing"><NoxusLogo size={44} animated /></Link>
        </div>

        <div className="flex justify-center mb-3">
          <BotAvatar mood={botMood} size={70} />
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
              s === step ? 'w-8 bg-nox-red' : s < step ? 'w-8 bg-nox-red/40' : 'w-8 bg-nox-border'
            }`} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h1 className="font-gaming text-xl text-white text-center mb-1 tracking-wider">CREATE ACCOUNT</h1>
            <p className="text-nox-muted text-center text-sm mb-6">Step 1 of 3</p>

            {error && (
              <div className="bg-nox-red/10 border border-nox-red/30 rounded-lg px-4 py-3 mb-4">
                <p className="text-nox-red text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full glass rounded-lg px-4 py-3 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full glass rounded-lg px-4 py-3 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
              
              {/* Password with toggle */}
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  className="w-full glass rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nox-muted hover:text-white transition-colors">
                  {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>

              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
                  className="w-full glass rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nox-muted hover:text-white transition-colors">
                  {showConfirm ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>

              <button onClick={handleStep1}
                className="w-full py-3 bg-nox-red hover:bg-nox-red-bright text-white font-gaming text-sm tracking-widest rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,45,85,0.3)]">
                NEXT →
              </button>
            </div>

            <p className="text-center text-sm text-nox-muted mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-nox-red hover:text-nox-red-bright">Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-slide-up">
            <h1 className="font-gaming text-xl text-white text-center mb-1 tracking-wider">YOUR GAMES</h1>
            <p className="text-nox-muted text-center text-sm mb-6">Pick the games you play</p>

            <div className="grid grid-cols-2 gap-2 mb-6 max-h-80 overflow-y-auto pr-1">
              {GAMES_LIST.map((game) => (
                <button key={game.id} onClick={() => toggleGame(game.id)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg text-left text-sm transition-all ${
                    selectedGames.includes(game.id)
                      ? 'bg-nox-red-glow-strong border border-nox-red/40 text-white'
                      : 'glass text-nox-muted hover:text-white hover:border-nox-red/20'
                  }`}>
                  <span className="text-lg">{game.icon}</span>
                  <span className="font-medium text-xs">{game.name}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-nox-border text-nox-muted rounded-lg text-sm hover:text-white transition-colors">← Back</button>
              <button onClick={() => selectedGames.length > 0 && setStep(3)} disabled={selectedGames.length === 0}
                className="flex-1 py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-30 text-white font-gaming text-sm tracking-widest rounded-lg transition-all">
                NEXT →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="animate-slide-up">
            <h1 className="font-gaming text-xl text-white text-center mb-1 tracking-wider">YOUR STYLE</h1>
            <p className="text-nox-muted text-center text-sm mb-6">Almost done!</p>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {PLAYSTYLES.map((style) => (
                <button key={style.id} onClick={() => setSelectedPlaystyle(style.id)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedPlaystyle === style.id
                      ? 'bg-nox-red-glow-strong border border-nox-red/40 text-white'
                      : 'glass text-nox-muted hover:text-white hover:border-nox-red/20'
                  }`}>
                  <span className="text-lg block mb-1">{style.icon}</span>
                  <span className="font-medium text-xs block">{style.label}</span>
                  <span className="text-[10px] text-nox-subtle block">{style.desc}</span>
                </button>
              ))}
            </div>

            <p className="text-nox-muted text-xs uppercase tracking-wider mb-3">What do you want from Nexus?</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {GOALS.map((goal) => (
                <button key={goal.id} onClick={() => toggleGoal(goal.id)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedGoals.includes(goal.id)
                      ? 'bg-nox-red-glow-strong border border-nox-red/40 text-white'
                      : 'glass text-nox-muted hover:text-white hover:border-nox-red/20'
                  }`}>
                  <span className="text-lg block">{goal.icon}</span>
                  <span className="text-[10px] font-medium">{goal.label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-nox-red/10 border border-nox-red/30 rounded-lg px-4 py-3 mb-4">
                <p className="text-nox-red text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-nox-border text-nox-muted rounded-lg text-sm hover:text-white transition-colors">← Back</button>
              <button onClick={handleComplete} disabled={isLoading}
                className="flex-1 py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-30 text-white font-gaming text-sm tracking-widest rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,45,85,0.3)]">
                {isLoading ? 'CREATING...' : 'ENTER NEXUS →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}