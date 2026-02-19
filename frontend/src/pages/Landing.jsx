import { useNavigate } from 'react-router-dom';
import NoxusLogo from '../components/NoxusLogo';
import BotAvatar from '../components/BotAvatar';
import ParticleBackground from '../components/ParticleBackground';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-nox-bg relative overflow-hidden">
      <ParticleBackground />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <NoxusLogo size={36} />
          <span className="font-gaming text-lg text-white tracking-widest">GG NEXUS</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/login')} className="px-5 py-2 text-sm text-nox-muted hover:text-white transition-colors font-medium">
            Sign In
          </button>
          <button onClick={() => navigate('/signup')} className="px-5 py-2 text-sm bg-nox-red hover:bg-nox-red-bright text-white rounded-lg font-medium transition-all hover:shadow-[0_0_20px_rgba(255,45,85,0.4)]">
            Get Started
          </button>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-20 text-center">
        <div className="mb-6 animate-slide-up">
          <BotAvatar mood="happy" size={160} />
        </div>
        <h1 className="font-gaming text-5xl md:text-7xl font-black text-white mb-4 tracking-tight animate-slide-up stagger-1">
          GG <span className="text-nox-red neon-text">NEXUS</span>
        </h1>
        <p className="font-display text-2xl md:text-3xl text-nox-muted mb-3 font-light animate-slide-up stagger-2 tracking-wide">
          AI That Plays Like You Think
        </p>
        <p className="text-sm text-nox-subtle max-w-lg mb-10 animate-slide-up stagger-3 leading-relaxed">
          Meet your personal gaming companion. Nexus learns your games, remembers your playstyle,
          and gives advice that actually makes you better. Not generic tips — real, personalized coaching.
        </p>
        <div className="flex gap-4 animate-slide-up stagger-4">
          <button onClick={() => navigate('/signup')}
            className="group relative px-10 py-4 bg-nox-red text-white font-gaming text-sm tracking-widest rounded-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,45,85,0.5)] hover:scale-105 active:scale-95 overflow-hidden">
            <span className="relative z-10">ENTER THE NEXUS</span>
            <div className="absolute inset-0 bg-linear-to-r from-nox-red-bright to-nox-red opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button onClick={() => navigate('/login')}
            className="px-10 py-4 border border-nox-border text-nox-text font-gaming text-sm tracking-widest rounded-lg hover:border-nox-red/50 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95">
            SIGN IN
          </button>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard icon={<BotAvatar mood="thinking" size={50} />} title="Thinks Before Speaking"
            desc="Nexus reasons through your question, pulls relevant data, and gives answers that make sense for YOUR situation." />
          <FeatureCard icon={<BotAvatar mood="happy" size={50} />} title="Remembers Everything"
            desc="Tell it your mains once. It remembers forever — your rank, your goals, your playstyle. Every chat makes it smarter." />
          <FeatureCard icon={<BotAvatar mood="excited" size={50} />} title="Reacts To You"
            desc="Win streak? It celebrates. Tilted? It helps you recover. Nexus responds like a real gaming buddy, not a textbook." />
        </div>
      </section>

      <section className="relative z-10 px-6 pb-20 max-w-4xl mx-auto">
        <h2 className="font-gaming text-2xl text-white text-center mb-12 tracking-wider">
          HOW IT <span className="text-nox-red">WORKS</span>
        </h2>
        <div className="space-y-6">
          <StepCard num="01" title="Set Up Your Profile" desc="Pick your games, playstyle, and goals. Takes 30 seconds. Nexus immediately knows what matters to you." />
          <StepCard num="02" title="Talk To Nexus" desc="Ask anything gaming-related. Game recs, strategy tips, build advice, or just vent about a bad match. Nexus gets it." />
          <StepCard num="03" title="Level Up Over Time" desc="The more you chat, the better Nexus knows you. It tracks your interests and adapts its recommendations to you specifically." />
        </div>
      </section>

      <section className="relative z-10 px-6 pb-20 max-w-4xl mx-auto text-center">
        <h2 className="font-gaming text-2xl text-white mb-4 tracking-wider">
          YOUR <span className="text-nox-red">GAMES</span>
        </h2>
        <p className="text-nox-muted text-sm mb-10">Deep knowledge across every major title</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['League of Legends', 'Valorant', 'TFT', 'Minecraft', 'COD', 'Apex Legends', 'Deadlock', 'Fortnite', 'CS2', 'Dota 2', 'Overwatch 2', 'Rocket League'].map((game) => (
            <span key={game} className="px-4 py-2 text-xs font-medium text-nox-muted border border-nox-border rounded-full hover:border-nox-red/30 hover:text-nox-red transition-all cursor-default">
              {game}
            </span>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 pb-16 text-center">
        <div className="glass rounded-2xl p-12 max-w-2xl mx-auto">
          <BotAvatar mood="excited" size={80} />
          <h2 className="font-gaming text-3xl text-white mt-6 mb-3 tracking-wider">READY?</h2>
          <p className="text-nox-muted text-sm mb-8">Free to use. Your AI companion is waiting.</p>
          <button onClick={() => navigate('/signup')}
            className="px-12 py-4 bg-nox-red hover:bg-nox-red-bright text-white font-gaming text-sm tracking-widest rounded-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,45,85,0.5)] hover:scale-105">
            CREATE YOUR ACCOUNT
          </button>
        </div>
      </section>

      <footer className="relative z-10 py-6 text-center border-t border-nox-border/30">
        <p className="text-xs text-nox-subtle/50">© 2026 GG Nexus</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass rounded-2xl p-6 hover:border-nox-red/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(255,45,85,0.1)]">
      <div className="mb-4">{icon}</div>
      <h3 className="font-gaming text-sm text-white mb-2 tracking-wider">{title}</h3>
      <p className="text-nox-muted text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc }) {
  return (
    <div className="flex gap-6 items-start glass rounded-xl p-6 hover:border-nox-red/20 transition-all">
      <span className="font-gaming text-3xl text-nox-red/30 font-black shrink-0">{num}</span>
      <div>
        <h3 className="font-display text-lg text-white font-semibold mb-1">{title}</h3>
        <p className="text-nox-muted text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}