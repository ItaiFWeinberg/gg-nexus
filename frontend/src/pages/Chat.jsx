import { useState, useRef, useEffect } from 'react';
import { RiSendPlaneFill, RiAddLine, RiHistoryLine, RiCloseLine, RiChat3Line } from 'react-icons/ri';
import { sendMessage, newSession, getSessionId, setSessionId, getSessionHistory, getChatSessions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BotAvatar from '../components/BotAvatar';

const VALID_MOODS = ['happy', 'empathy', 'excited', 'thinking', 'curious', 'proud', 'frustrated', 'idle', 'playful', 'intense', 'supportive', 'impressed'];

// Fallback mood detection if AI doesn't send a tag
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

// Parse [MOOD:xxx] tag from AI response, return { mood, text }
function parseMoodTag(response) {
  const match = response.match(/^\[MOOD:(\w+)\]\s*/i);
  if (match && VALID_MOODS.includes(match[1].toLowerCase())) {
    return {
      mood: match[1].toLowerCase(),
      text: response.replace(match[0], '').trim()
    };
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

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botMood, setBotMood] = useState('happy');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(getSessionId());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const sessionId = getSessionId();
        const data = await getSessionHistory(sessionId);
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map(m => ({ role: m.role, content: m.content })));
          const lastAssistant = [...data.messages].reverse().find(m => m.role === 'assistant');
          if (lastAssistant) setBotMood(detectMood(lastAssistant.content));
        } else {
          showWelcome();
        }
      } catch {
        showWelcome();
      } finally {
        setInitialLoad(false);
      }
    };
    loadHistory();
  }, [user, currentSessionId]);

  const showWelcome = () => {
    const name = user?.username || 'Player';
    setMessages([{
      role: 'assistant',
      content: `What's good, ${name}. I'm Nexus — your gaming companion. What can I help you with?`
    }]);
    setBotMood('happy');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory) loadSessions();
    setShowHistory(!showHistory);
  };

  const handleSwitchSession = async (sessionId) => {
    try {
      setSessionId(sessionId);
      setCurrentSessionId(sessionId);
      const data = await getSessionHistory(sessionId);
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map(m => ({ role: m.role, content: m.content })));
        const lastAssistant = [...data.messages].reverse().find(m => m.role === 'assistant');
        if (lastAssistant) setBotMood(detectMood(lastAssistant.content));
      }
      setShowHistory(false);
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setBotMood('thinking');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendMessage(userMessage);

      let responseText = data.response;
      let aiMood = data.mood || null;

      if (!aiMood) {
        const { mood: parsedMood, text: cleanText } = parseMoodTag(responseText);
        aiMood = parsedMood;
        responseText = cleanText;
      }

      const { text: finalText } = parseMoodTag(responseText);

      if (aiMood && VALID_MOODS.includes(aiMood)) {
        setBotMood(aiMood);
      } else {
        const fallback = detectMood(finalText);
        setBotMood(fallback !== 'idle' ? fallback : 'happy');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: finalText }]);
    } catch (err) {
      setBotMood('empathy');
      const errMsg = err.response?.data?.error || "Something went wrong. Make sure the backend is running.";
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleNewChat = () => {
    const sid = newSession();
    setCurrentSessionId(sid);
    showWelcome();
    setShowHistory(false);
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-screen bg-nox-bg">
        <BotAvatar mood="thinking" size={80} />
      </div>
    );
  }

  const moodLabel = {
    happy: '😊 Feeling good', empathy: '💙 Here for you', excited: '🔥 Let\'s go!',
    thinking: '🤔 Processing...', idle: '👋 Ready', curious: '🧐 Interesting...',
    proud: '⭐ Nice!', frustrated: '😤 I hear you', playful: '😏 Having fun',
    intense: '⚔️ Locked in', supportive: '💪 Got your back', impressed: '🤩 Whoa!'
  };

  return (
    <div className="flex flex-col h-screen bg-nox-bg">
      {/* Header */}
      <div className="border-b border-nox-border bg-nox-dark/90 backdrop-blur-md px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BotAvatar mood={botMood} size={44} />
            <div>
              <h1 className="font-gaming text-sm text-white tracking-wider">NEXUS</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-nox-green animate-pulse"></span>
                <p className="text-[10px] text-nox-muted font-display tracking-wider">
                  {isLoading ? 'THINKING...' : (moodLabel[botMood] || 'ONLINE')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleToggleHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-nox-muted hover:text-white hover:bg-nox-hover transition-all text-xs">
              <RiHistoryLine />
              <span className="hidden md:inline">History</span>
            </button>
            <button onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-nox-muted hover:text-white hover:bg-nox-hover transition-all text-xs">
              <RiAddLine />
              <span className="hidden md:inline">New Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">

        {/* History sidebar */}
        {showHistory && (
          <div className="w-72 border-r border-nox-border bg-nox-dark/50 flex flex-col shrink-0 animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-nox-border">
              <h2 className="font-gaming text-xs text-white tracking-wider">CONVERSATIONS</h2>
              <button onClick={() => setShowHistory(false)} className="text-nox-muted hover:text-white"><RiCloseLine /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.length === 0 ? (
                <p className="text-nox-subtle text-xs text-center py-8">No conversations yet</p>
              ) : (
                sessions.map((s) => (
                  <button key={s.session_id} onClick={() => handleSwitchSession(s.session_id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      s.session_id === currentSessionId
                        ? 'bg-nox-red-glow border border-nox-red/20'
                        : 'hover:bg-nox-hover'
                    }`}>
                    <div className="flex items-start gap-2">
                      <RiChat3Line className="text-nox-muted mt-0.5 shrink-0 text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white truncate font-medium">{s.title}</p>
                        <p className="text-[10px] text-nox-subtle truncate mt-0.5">{s.preview}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-nox-subtle">{s.message_count} msgs</span>
                          <span className="text-[9px] text-nox-subtle">{formatTimeAgo(s.last_time)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex">
          {/* Bot column */}
          <div className="hidden lg:flex w-44 flex-col items-center pt-8 shrink-0 border-r border-nox-border/30">
            <div className="sticky top-8">
              <BotAvatar mood={botMood} size={110} />
              <p className="font-gaming text-[10px] text-nox-subtle text-center mt-3 tracking-widest">NEXUS</p>
              <p className="text-[10px] text-nox-muted text-center mt-1">{moodLabel[botMood] || 'Ready'}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
              {messages.length <= 1 && (
                <div className="flex flex-col items-center py-6 mb-4 lg:hidden">
                  <BotAvatar mood="happy" size={80} />
                </div>
              )}

              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ animation: `${msg.role === 'user' ? 'slide-in-right' : 'slide-in-left'} 0.3s ease-out forwards` }}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-nox-red-glow border border-nox-red/20 flex items-center justify-center shrink-0 mt-1">
                        <span className="text-nox-red text-[10px] font-gaming">N</span>
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-nox-red to-nox-red-dim text-white rounded-br-sm'
                        : 'glass text-nox-text rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{stripMoodTags(msg.content)}</p>                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-nox-hover border border-nox-border flex items-center justify-center shrink-0 mt-1">
                        <span className="text-nox-muted text-[10px] font-gaming">{user?.username?.charAt(0).toUpperCase() || 'P'}</span>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start" style={{ animation: 'slide-in-left 0.3s ease-out forwards' }}>
                    <div className="w-7 h-7 rounded-lg bg-nox-red-glow border border-nox-red/20 flex items-center justify-center shrink-0">
                      <span className="text-nox-red text-[10px] font-gaming">N</span>
                    </div>
                    <div className="glass rounded-2xl rounded-bl-sm px-5 py-4">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 bg-nox-red rounded-full" style={{ animation: 'bounce-dot 1.4s ease-in-out infinite' }}></span>
                        <span className="w-2 h-2 bg-nox-red rounded-full" style={{ animation: 'bounce-dot 1.4s ease-in-out infinite 0.2s' }}></span>
                        <span className="w-2 h-2 bg-nox-red rounded-full" style={{ animation: 'bounce-dot 1.4s ease-in-out infinite 0.4s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 shrink-0">
                <div className="max-w-2xl mx-auto flex flex-wrap gap-2 justify-center">
                  {["Recommend me a new game 🎮", "Help me improve at Valorant 🎯", "What's the current LoL meta? ⚔️", "I just lost 5 ranked games 😤"].map((s) => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="px-3 py-2 text-xs glass rounded-lg text-nox-muted hover:text-nox-red hover:border-nox-red/30 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-nox-border bg-nox-dark/90 backdrop-blur-md p-4 shrink-0">
              <div className="flex gap-3 max-w-2xl mx-auto">
                <textarea ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask Nexus anything about gaming..."
                  rows={1}
                  className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder-nox-subtle resize-none focus:outline-none focus:border-nox-red/50 transition-colors" />
                <button onClick={handleSend} disabled={!input.trim() || isLoading}
                  className="px-5 py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,45,85,0.4)]">
                  <RiSendPlaneFill className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}