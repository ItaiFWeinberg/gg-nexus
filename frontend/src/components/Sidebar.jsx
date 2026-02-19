import { NavLink, useNavigate } from 'react-router-dom';
import { RiDashboardLine, RiChatSmile2Line, RiGamepadLine, RiBarChartLine, RiBookOpenLine, RiTeamLine, RiLogoutBoxLine } from 'react-icons/ri';
import NoxusLogo from './NoxusLogo';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/chat', icon: RiChatSmile2Line, label: 'Nexus AI' },
  { path: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
  { path: '/recommendations', icon: RiGamepadLine, label: 'Games' },
  { path: '/stats', icon: RiBarChartLine, label: 'Stats' },
  { path: '/guides', icon: RiBookOpenLine, label: 'Guides' },
  { path: '/community', icon: RiTeamLine, label: 'Community' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  return (
    <aside className="w-20 lg:w-64 bg-nox-dark border-r border-nox-border flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-3 lg:p-5 border-b border-nox-border">
        <div className="flex items-center gap-3 justify-center lg:justify-start">
          <NoxusLogo size={42} />
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-white tracking-wide">GG NEXUS</h1>
            <p className="text-[10px] text-nox-muted uppercase tracking-[3px]">AI Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 lg:p-3 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-nox-red-glow text-nox-red border border-nox-red/20'
                  : 'text-nox-muted hover:text-nox-text hover:bg-nox-hover'
              }`
            }>
            <item.icon className="text-xl shrink-0 mx-auto lg:mx-0" />
            <span className="hidden lg:block text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 lg:p-3 border-t border-nox-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-nox-red-glow border border-nox-red/30 flex items-center justify-center text-nox-red text-sm font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{user?.username || 'Player'}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-nox-green"></span>
              <p className="text-xs text-nox-muted">Online</p>
            </div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-nox-muted hover:text-nox-red hover:bg-nox-hover transition-all">
          <RiLogoutBoxLine className="text-lg mx-auto lg:mx-0" />
          <span className="hidden lg:block text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}