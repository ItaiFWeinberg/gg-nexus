import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import NoxusLogo from '../components/NoxusLogo';
import BotAvatar from '../components/BotAvatar';
import ParticleBackground from '../components/ParticleBackground';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    if (!username || !password) return setError('All fields are required');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nox-bg relative overflow-hidden flex items-center justify-center px-6">
      <ParticleBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-3">
          <Link to="/landing"><NoxusLogo size={44} animated /></Link>
        </div>
        <div className="flex justify-center mb-5">
          <BotAvatar mood="idle" size={80} />
        </div>

        <h1 className="font-gaming text-2xl text-white text-center mb-1 tracking-wider">WELCOME BACK</h1>
        <p className="text-nox-muted text-center text-sm mb-6">Sign in to continue</p>

        {error && (
          <div className="bg-nox-red/10 border border-nox-red/30 rounded-lg px-4 py-3 mb-4">
            <p className="text-nox-red text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full glass rounded-lg px-4 py-3 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />

          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full glass rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 transition-colors" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nox-muted hover:text-white transition-colors">
              {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>

          <button onClick={handleSubmit} disabled={isLoading || !username || !password}
            className="w-full py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-30 text-white font-gaming text-sm tracking-widest rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,45,85,0.3)]">
            {isLoading ? 'CONNECTING...' : 'SIGN IN'}
          </button>
        </div>

        <p className="text-center text-sm text-nox-muted mt-6">
          New here?{' '}
          <Link to="/signup" className="text-nox-red hover:text-nox-red-bright">Create account</Link>
        </p>
      </div>
    </div>
  );
}