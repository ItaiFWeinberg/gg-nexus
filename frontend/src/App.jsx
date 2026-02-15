import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

/**
 * App — Root component with authentication routing
 * 
 * ROUTING LOGIC:
 * - Not logged in → Landing, Login, Signup pages (no sidebar)
 * - Logged in → Dashboard, Chat, etc. (with sidebar)
 * - Trying to access /chat without auth → redirect to /login
 * 
 * AuthProvider wraps everything so ALL components can access useAuth()
 */

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show nothing while checking auth status (prevents flash of wrong page)
  if (loading) {
    return (
      <div className="min-h-screen bg-nox-bg flex items-center justify-center">
        <div className="text-nox-red text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* PUBLIC ROUTES — no auth required, no sidebar */}
      <Route path="/landing" element={!user ? <Landing /> : <Navigate to="/chat" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/chat" />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/chat" />} />

      {/* PROTECTED ROUTES — auth required, with sidebar */}
      <Route path="/*" element={user ? <ProtectedLayout /> : <Navigate to="/landing" />} />
    </Routes>
  );
}

function ProtectedLayout() {
  return (
    <div className="flex min-h-screen bg-nox-bg">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recommendations" element={<ComingSoon title="Game Recommendations" desc="AI-powered game discovery using RAG" phase="2" />} />
          <Route path="/stats" element={<ComingSoon title="Performance Analytics" desc="Stats analysis with agent tools" phase="2" />} />
          <Route path="/guides" element={<ComingSoon title="Strategy Hub" desc="Builds and guides via specialist agents" phase="2" />} />
          <Route path="/community" element={<ComingSoon title="Community" desc="Share builds and connect with gamers" phase="3" />} />
        </Routes>
      </main>
    </div>
  );
}

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