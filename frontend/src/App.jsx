import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-nox-bg">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/recommendations" element={<ComingSoon title="Game Recommendations" desc="AI-powered game discovery using RAG" phase="2" />} />
            <Route path="/stats" element={<ComingSoon title="Performance Analytics" desc="Stats analysis with agent tools" phase="2" />} />
            <Route path="/guides" element={<ComingSoon title="Strategy Hub" desc="Builds and guides via specialist agents" phase="2" />} />
            <Route path="/community" element={<ComingSoon title="Community" desc="Share builds and connect with gamers" phase="3" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

/** Placeholder page for features coming in later phases */
function ComingSoon({ title, desc, phase }) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-nox-red text-sm font-medium uppercase tracking-widest mb-3">Phase {phase}</p>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-nox-muted">{desc}</p>
      </div>
    </div>
  );
}

export default App;