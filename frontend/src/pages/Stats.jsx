import { useState, useEffect } from 'react';
import { RiTrophyLine, RiSwordLine, RiStarLine, RiBrainLine, RiTimeLine, RiChatSmile2Line, RiGamepadLine, RiUserLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { getPlayerStats } from '../services/api';
import BotAvatar from '../components/BotAvatar';

const ARCHETYPE_COLORS = {
  grinder: '#ff8c00', strategist: '#4d8eff', socializer: '#00ff88',
  completionist: '#ffd700', 'thrill-seeker': '#ff2d55', learner: '#8b5cf6',
  veteran: '#c8aa6e',
};

const ARCHETYPE_ICONS = {
  grinder: '⚔️', strategist: '🧠', socializer: '💬',
  completionist: '🏅', 'thrill-seeker': '🔥', learner: '📚', veteran: '👑',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-nox-card border border-nox-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="text-sm" style={{ color: color || '#7070a0' }} />
        <p className="text-nox-muted text-[10px] uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color: color || 'white' }}>{value}</p>
    </div>
  );
}

function InsightCard({ title, content, icon }) {
  if (!content) return null;
  return (
    <div className="bg-nox-card border border-nox-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <p className="text-xs text-nox-muted uppercase tracking-wider font-medium">{title}</p>
      </div>
      <p className="text-sm text-nox-text leading-relaxed">{content}</p>
    </div>
  );
}

export default function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerStats()
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-nox-red text-lg animate-pulse">Loading stats...</div>
      </div>
    );
  }

  const profile = stats?.profile || {};
  const activity = stats?.activity || {};
  const insights = stats?.ai_insights || {};
  const games = profile.games || [];
  const archetype = insights.archetype;
  const archetypeColor = ARCHETYPE_COLORS[archetype] || '#ff2d55';
  const archetypeIcon = ARCHETYPE_ICONS[archetype] || '🎮';

  const memberSince = activity.member_since
    ? new Date(activity.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Just joined';

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-1">Player <span className="text-nox-red">Analytics</span></h1>
      <p className="text-nox-muted text-sm mb-8">Your gaming profile, AI insights, and activity — all in one place</p>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={RiGamepadLine} label="Games" value={games.length} color="#ff2d55" />
        <StatCard icon={RiTrophyLine} label="Ranked In" value={Object.keys(profile.ranks || {}).length} color="#ffd700" />
        <StatCard icon={RiChatSmile2Line} label="Messages" value={activity.total_messages || 0} color="#4d8eff" />
        <StatCard icon={RiTimeLine} label="Sessions" value={activity.total_sessions || 0} color="#00ff88" />
      </div>

      {/* Player archetype */}
      {archetype && (
        <div className="bg-nox-card border rounded-2xl p-6 mb-8" style={{ borderColor: `${archetypeColor}30` }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: `${archetypeColor}15`, border: `1px solid ${archetypeColor}30` }}>
              {archetypeIcon}
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-nox-muted uppercase tracking-widest mb-1">Player Archetype</p>
              <h2 className="text-2xl font-bold capitalize" style={{ color: archetypeColor }}>
                The {archetype}
              </h2>
              {insights.personality && (
                <p className="text-sm text-nox-muted mt-1">{insights.personality}</p>
              )}
            </div>
            <BotAvatar mood="impressed" size={44} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Game ranks */}
        <div className="bg-nox-card border border-nox-border rounded-2xl p-5">
          <h3 className="text-xs text-nox-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <RiTrophyLine className="text-nox-gold" /> Your Ranks
          </h3>
          {Object.keys(profile.ranks || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(profile.ranks).map(([game, rank]) => (
                <div key={game} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{game}</span>
                    {profile.roles?.[game] && (
                      <span className="text-[10px] text-nox-subtle px-1.5 py-0.5 bg-nox-hover rounded">
                        {profile.roles[game]}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-nox-gold">{rank}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-nox-subtle">No ranks set yet</p>
          )}
        </div>

        {/* Skill levels */}
        <div className="bg-nox-card border border-nox-border rounded-2xl p-5">
          <h3 className="text-xs text-nox-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <RiStarLine className="text-nox-blue" /> Skill Levels
          </h3>
          {Object.keys(profile.skills || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(profile.skills).map(([game, skill]) => {
                const skillIndex = ['Beginner', 'Intermediate', 'Advanced', 'Expert'].indexOf(skill);
                const pct = skillIndex >= 0 ? (skillIndex + 1) * 25 : 50;
                return (
                  <div key={game}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{game}</span>
                      <span className="text-xs text-nox-muted">{skill}</span>
                    </div>
                    <div className="h-1.5 bg-nox-border rounded-full overflow-hidden">
                      <div className="h-full bg-nox-blue rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-nox-subtle">No skill data yet</p>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {(insights.growth_areas || insights.coaching_style || insights.recent_mood) && (
        <>
          <h3 className="text-xs text-nox-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <RiBrainLine className="text-nox-red" /> Nexus Insights
            <span className="text-[9px] text-nox-subtle">(evolves as you chat)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <InsightCard title="Growth Areas" content={insights.growth_areas} icon="📈" />
            <InsightCard title="Coaching Style" content={insights.coaching_style} icon="🎯" />
            <InsightCard title="Recent Mood" content={insights.recent_mood} icon="💭" />
            {insights.discovered_interests?.length > 0 && (
              <InsightCard title="Discovered Interests"
                content={insights.discovered_interests.join(', ')} icon="🔍" />
            )}
          </div>
        </>
      )}

      {/* Member info */}
      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <RiUserLine className="text-nox-subtle" />
        <p className="text-xs text-nox-subtle">
          Member since {memberSince} • {activity.total_messages || 0} messages across {activity.total_sessions || 0} sessions
        </p>
      </div>
    </div>
  );
}