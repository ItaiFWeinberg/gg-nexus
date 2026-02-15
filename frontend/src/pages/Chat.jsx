import { useState, useRef, useEffect } from 'react';
import { RiSendPlaneFill, RiAddLine } from 'react-icons/ri';
import { sendMessage, newSession, getSessionId, getSessionHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BotAvatar from '../components/BotAvatar';

function detectMood(message) {
  const lower = message.toLowerCase();
  if (/lost|lose|tilted|frustrated|stuck|bad|hate|suck|died|feed|angry|sad/.test(lower)) return 'empathy';
  if (/won|win|clutch|carry|rank up|promoted|mvp|ace|penta|amazing|great|awesome|nice/.test(lower)) return 'happy';
  if (/recommend|suggest|what should|new game|try|discover|looking for|best|which/.test(lower)) return 'excited';
  return 'idle';
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botMood, setBotMood] = useState('happy');
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversation from MongoDB on mount (survives refresh!)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const sessionId = getSessionId();
        const data = await getSessionHistory(sessionId);

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map(m => ({
            role: m.role,
            content: m.content
          })));
        } else {
          const name = user?.username || 'Player';
          setMessages([{
            role: 'assistant',
            content: `What's good, ${name}. I'm Nexus — your gaming companion. I know your games, I learn your playstyle, and I get better every time we talk. What can I help you with?`
          }]);
        }
      } catch {
        const name = user?.username || 'Player';
        setMessages([{
          role: 'assistant',
          content: `What's good, ${name}. I'm Nexus — your gaming companion. What can I help you with?`
        }]);
      } finally {
        setInitialLoad(false);
      }
    };

    loadHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setBotMood('thinking');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendMessage(userMessage);
      const responseMood = detectMood(data.response);
      const userMood = detectMood(userMessage);
      setBotMood(responseMood !== 'idle' ? responseMood : userMood !== 'idle' ? userMood : 'happy');
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
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
    newSession();
    const name = user?.username || 'Player';
    setMessages([{
      role: 'assistant',
      content: `Fresh session! What's on your mind, ${name}?`
    }]);
    setBotMood('happy');
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-screen bg-nox-bg">
        <BotAvatar mood="thinking" size={80} />
      </div>
    );
  }

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
                  {isLoading ? 'THINKING...' : botMood === 'happy' ? 'READY' : botMood === 'empathy' ? 'LISTENING' : botMood === 'excited' ? 'HYPED' : 'ONLINE'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-nox-muted hover:text-white hover:bg-nox-hover transition-all text-xs">
            <RiAddLine />
            <span className="hidden md:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages with bot always visible on left */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full">
          
          {/* Bot column — always visible */}
          <div className="hidden lg:flex w-48 flex-col items-center pt-8 shrink-0 border-r border-nox-border/30">
            <div className="sticky top-8">
              <BotAvatar mood={botMood} size={120} />
              <p className="font-gaming text-[10px] text-nox-subtle text-center mt-3 tracking-widest">NEXUS</p>
              <p className="text-[10px] text-nox-muted text-center mt-1">
                {botMood === 'happy' && '😊 Feeling good'}
                {botMood === 'empathy' && '💙 Here for you'}
                {botMood === 'excited' && '🔥 Let\'s go!'}
                {botMood === 'thinking' && '🤔 Processing...'}
                {botMood === 'idle' && '👋 Ready'}
              </p>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 px-4 lg:px-6 py-4">
            {/* Intro when conversation is short */}
            {messages.length <= 1 && (
              <div className="flex flex-col items-center py-6 mb-4 lg:hidden">
                <BotAvatar mood="happy" size={90} />
                <p className="font-gaming text-[10px] text-nox-subtle mt-3 tracking-widest">YOUR GAMING COMPANION</p>
              </div>
            )}

            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  style={{ animation: `${msg.role === 'user' ? 'slide-in-right' : 'slide-in-left'} 0.3s ease-out forwards` }}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-nox-red-glow border border-nox-red/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-nox-red text-xs font-gaming">N</span>
                    </div>
                  )}

                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-nox-red to-nox-red-dim text-white rounded-br-sm'
                      : 'glass text-nox-text rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-nox-hover border border-nox-border flex items-center justify-center shrink-0 mt-1">
                      <span className="text-nox-muted text-xs font-gaming">{user?.username?.charAt(0).toUpperCase() || 'P'}</span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start" style={{ animation: 'slide-in-left 0.3s ease-out forwards' }}>
                  <div className="w-8 h-8 rounded-lg bg-nox-red-glow border border-nox-red/20 flex items-center justify-center shrink-0">
                    <span className="text-nox-red text-xs font-gaming">N</span>
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
        </div>
      </div>

      {/* Quick suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 shrink-0">
          <div className="max-w-2xl mx-auto flex flex-wrap gap-2 justify-center">
            {[
              "Recommend me a new game 🎮",
              "Help me improve at Valorant 🎯",
              "What's the current LoL meta? ⚔️",
              "I just lost 5 ranked games 😤"
            ].map((s) => (
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
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Ask Nexus anything about gaming...`}
            rows={1}
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder-nox-subtle resize-none focus:outline-none focus:border-nox-red/50 transition-colors"
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading}
            className="px-5 py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,45,85,0.4)]">
            <RiSendPlaneFill className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}