import { useNavigate } from 'react-router-dom';
import { RiChatSmile2Line, RiGamepadLine, RiBarChartLine, RiFlashlightLine } from 'react-icons/ri';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, <span className="text-nox-red">Player</span>
        </h1>
        <p className="text-nox-muted">Your AI gaming command center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard 
          label="Favorite Games" 
          value="4" 
          detail="LoL, Valorant, TFT, Minecraft" 
          color="red" 
        />
        <StatCard 
          label="AI Sessions" 
          value="0" 
          detail="Start a conversation!" 
          color="muted" 
        />
        <StatCard 
          label="System Status" 
          value="Online" 
          detail="All agents operational" 
          color="green" 
        />
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        
        {/* Chat CTA — Primary action */}
        <button
          onClick={() => navigate('/chat')}
          className="group bg-nox-card border border-nox-border rounded-2xl p-6 text-left 
                     hover:border-nox-red/40 hover:bg-nox-red-glow transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-nox-red-glow border border-nox-red/20 
                          flex items-center justify-center group-hover:border-nox-red/40 transition-colors">
              <RiChatSmile2Line className="text-nox-red text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Chat with Nexus AI</h2>
              <p className="text-sm text-nox-muted">
                Get personalized game recommendations, strategy tips, and performance analysis
              </p>
              <span className="inline-block mt-3 text-xs text-nox-red font-medium uppercase tracking-wider 
                             group-hover:tracking-[4px] transition-all">
                Launch Chat →
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
              <p className="text-sm text-nox-muted">AI-powered game discovery based on your playstyle</p>
              <span className="inline-block mt-3 text-xs text-nox-subtle font-medium uppercase tracking-wider">
                Phase 2 — RAG + Tools
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-nox-card border border-nox-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-nox-muted uppercase tracking-wider mb-4">
          <RiFlashlightLine className="inline mr-2 text-nox-red" />
          Powered By
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'React', type: 'frontend' },
            { name: 'Flask', type: 'backend' },
            { name: 'Gemini AI', type: 'llm' },
            { name: 'MongoDB', type: 'database' },
            { name: 'Docker', type: 'infra' },
            { name: 'Agentic AI', type: 'ai' },
            { name: 'RAG', type: 'ai' },
            { name: 'ReAct', type: 'ai' },
            { name: 'Multi-Agent', type: 'ai' },
          ].map((tech) => (
            <span
              key={tech.name}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium border ${
                tech.type === 'ai'
                  ? 'bg-nox-red-glow text-nox-red border-nox-red/20'
                  : 'bg-nox-hover text-nox-muted border-nox-border'
              }`}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail, color }) {
  const valueColor = {
    red: 'text-nox-red',
    green: 'text-nox-green',
    muted: 'text-white',
  }[color];

  return (
    <div className="bg-nox-card border border-nox-border rounded-2xl p-5">
      <p className="text-nox-muted text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-xs text-nox-subtle mt-1">{detail}</p>
    </div>
  );
}