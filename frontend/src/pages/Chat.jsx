import { useState, useRef, useEffect, useCallback } from 'react';
import { RiSendPlaneFill, RiAddLine, RiHistoryLine, RiCloseLine, RiChat3Line } from 'react-icons/ri';
import { sendMessage, newSession, getSessionId, setSessionId, getSessionHistory, getChatSessions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BotAvatar from '../components/BotAvatar';

const VALID_MOODS = ['happy', 'empathy', 'excited', 'thinking', 'curious', 'proud', 'frustrated', 'idle', 'playful', 'intense', 'supportive', 'impressed'];

function detectMood(message) {
  const lower = message.toLowerCase();
  if (/lost|lose|losing|tilted|frustrated|stuck|bad|hate|suck|died|feed|angry|sad|depressed|hopeless|trash|garbage|horrible|worst|demoted|deranked/.test(lower)) return 'empathy';
  if (/what is|how does|how do|explain|what's the|curious|wondering|hmm|confused|difference between|tell me about/.test(lower)) return 'curious';
  if (/won|win|clutch|carry|rank up|promoted|mvp|ace|penta|amazing|great|awesome|nice|finally|achieved|mastered|first time/.test(lower)) return 'proud';
  if (/recommend|suggest|what should|new game|try|discover|looking for|best|which|hype|excited|can't wait|love/.test(lower)) return 'excited';
  if (/broken|op|nerf|unfair|bs|buggy|lag|cheat|toxic|elo hell|team diff/.test(lower)) return 'frustrated';
  if (/thanks|thank you|helpful|good|cool|fun|enjoy|appreciate|lol|haha|lmao/.test(lower)) return 'happy';
  return 'idle';
}

function parseMoodTag(response) {
  const match = response.match(/^\[MOOD:(\w+)\]\s*/i);
  if (match && VALID_MOODS.includes(match[1].toLowerCase())) {
    return { mood: match[1].toLowerCase(), text: response.replace(match[0], '').trim() };
  }
  return { mood: null, text: response };
}

function stripMoodTags(text) {
  return text.replace(/\[MOOD:\w+\]\s*/gi, '').trim();
}

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function buildWelcomeMessage(user) {
  const profile = user?.profile || {};
  const name = user?.username || 'Player';
  const games = profile.favorite_games || [];
  const ranks = profile.ranks || {};
  const roles = profile.main_roles || {};
  const playstyle = (profile.playstyle || [])[0] || '';
  const goals = profile.goals || [];

  if (games.length === 0) {
    return `Hey ${name}! I'm Nexus, your gaming AI companion. Tell me what games you play and I'll help with builds, strategy, recommendations — anything gaming!`;
  }

  let msg = `Hey ${name}! `;

  const gameDetails = games.slice(0, 3).map(g => {
    let detail = g;
    if (ranks[g]) detail += ` (${ranks[g]})`;
    if (roles[g]) detail += ` — ${roles[g]} main`;
    return detail;
  });

  msg += `I see you're into ${gameDetails.join(', ')}`;
  if (games.length > 3) msg += ` and ${games.length - 3} more`;
  msg += '. ';

  if (playstyle === 'competitive') msg += "Competitive mindset — I respect it. ";
  else if (playstyle === 'casual') msg += "Love the chill vibes. ";
  else if (playstyle === 'explorer') msg += "Always finding new games — nice! ";

  if (goals.includes('rank')) msg += "Ready to help you climb. ";
  else if (goals.includes('improve')) msg += "Let's sharpen those skills. ";
  else if (goals.includes('newgames')) msg += "I've got some great recommendations. ";

  msg += "What can I help with today?";
  return msg;
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botMood, setBotMood] = useState('happy');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(getSessionId());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showWelcome = useCallback(() => {
    const welcomeText = buildWelcomeMessage(user);
    setMessages([{ role: 'assistant', content: welcomeText }]);
    setBotMood('happy');
    setInitialLoad(false);
  }, [user]);

  useEffect(() => {
    if (initialLoad) showWelcome();
  }, [initialLoad, showWelcome]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMood = detectMood(trimmed);
    setBotMood('thinking');

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendMessage(trimmed);
      let responseText = data.response;
      let responseMood = data.mood || 'idle';

      const parsed = parseMoodTag(responseText);
      if (parsed.mood) {
        responseMood = parsed.mood;
        responseText = parsed.text;
      }
      responseText = stripMoodTags(responseText);

      if (!VALID_MOODS.includes(responseMood)) responseMood = userMood;
      setBotMood(responseMood);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: responseText,
          mood: responseMood,
          agentInfo: data.agent_info,
        },
      ]);
    } catch (err) {
      const errorMsg = err.response?.status === 429
        ? "I'm thinking hard — give me a sec and try again!"
        : "Something went wrong. Try again?";
      setBotMood('empathy');
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    const id = newSession();
    setCurrentSession(id);
    showWelcome();
  };

  const loadSession = async (sessionId) => {
    try {
      setSessionId(sessionId);
      setCurrentSession(sessionId);
      const data = await getSessionHistory(sessionId);
      const msgs = (data.messages || []).map(m => ({
        role: m.role,
        content: stripMoodTags(m.content),
      }));
      setMessages(msgs.length > 0 ? msgs : [{ role: 'assistant', content: buildWelcomeMessage(user) }]);
      setShowHistory(false);
      setInitialLoad(false);
    } catch {
      setShowHistory(false);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data.sessions || []);
    } catch { /* ignore */ }
  };

  const toggleHistory = () => {
    if (!showHistory) loadSessions();
    setShowHistory(!showHistory);
  };

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-nox-bg via-nox-dark to-nox-bg relative">

      {/* Header */}
      <div className="border-b border-nox-border px-4 py-3 flex items-center justify-between bg-nox-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <BotAvatar mood={botMood} size={38} />
          <div>
            <h2 className="text-sm font-semibold text-white">Nexus AI</h2>
            <p className="text-[10px] text-nox-muted">
              {isLoading ? 'Thinking...' : botMood === 'idle' ? 'Ready' : botMood.charAt(0).toUpperCase() + botMood.slice(1)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleHistory} title="Chat history"
            className="p-2 rounded-lg text-nox-muted hover:text-white hover:bg-nox-hover transition-colors">
            <RiHistoryLine className="text-lg" />
          </button>
          <button onClick={handleNewSession} title="New chat"
            className="p-2 rounded-lg text-nox-muted hover:text-nox-red hover:bg-nox-hover transition-colors">
            <RiAddLine className="text-lg" />
          </button>
        </div>
      </div>

      {/* History sidebar */}
      {showHistory && (
        <div className="absolute top-14 right-2 z-50 w-72 max-h-96 bg-nox-card border border-nox-border rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-nox-border">
            <span className="text-xs text-nox-muted uppercase tracking-wider font-medium">History</span>
            <button onClick={() => setShowHistory(false)} className="text-nox-muted hover:text-white">
              <RiCloseLine />
            </button>
          </div>
          <div className="overflow-y-auto max-h-80">
            {sessions.length === 0 ? (
              <p className="text-xs text-nox-subtle p-4 text-center">No past sessions</p>
            ) : (
              sessions.map((s) => (
                <button key={s.session_id} onClick={() => loadSession(s.session_id)}
                  className={`w-full text-left px-4 py-3 hover:bg-nox-hover transition-colors border-b border-nox-border/50 ${
                    s.session_id === currentSession ? 'bg-nox-red-glow border-l-2 border-l-nox-red' : ''
                  }`}>
                  <div className="flex items-center gap-2">
                    <RiChat3Line className="text-nox-subtle text-xs shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white truncate">{s.preview || 'Chat session'}</p>
                      <p className="text-[10px] text-nox-subtle">{s.message_count} msgs • {formatTimeAgo(s.last_message)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animation: `slide-in-${msg.role === 'user' ? 'right' : 'left'} 0.3s ease-out` }}>
            {msg.role === 'assistant' && (
              <div className="shrink-0 mt-1">
                <BotAvatar mood={msg.mood || botMood} size={32} />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-nox-red text-white rounded-br-md'
                : 'bg-nox-card border border-nox-border text-nox-text rounded-bl-md'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.agentInfo && msg.agentInfo.tools_used?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-[10px] text-nox-subtle">
                    Tools: {msg.agentInfo.tools_used.map(t => t.split('(')[0]).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <BotAvatar mood="thinking" size={32} />
            <div className="bg-nox-card border border-nox-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-nox-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-nox-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-nox-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-nox-border px-4 py-3 bg-nox-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <input ref={inputRef} type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask Nexus anything about gaming..."
            disabled={isLoading}
            className="flex-1 bg-nox-card border border-nox-border rounded-xl px-4 py-3 text-sm text-white placeholder-nox-subtle focus:outline-none focus:border-nox-red/50 disabled:opacity-50 transition-colors" />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}
            className="p-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-30 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(255,45,85,0.3)]">
            <RiSendPlaneFill className="text-white text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}