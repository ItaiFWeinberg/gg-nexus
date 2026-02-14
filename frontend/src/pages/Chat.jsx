import { useState, useRef, useEffect } from 'react';
import { RiSendPlaneFill, RiRobot2Line, RiUser3Line } from 'react-icons/ri';
import { sendMessage } from '../services/api';

/**
 * Chat Page - The core of GG Nexus
 * 
 * This is where users interact with Nexus AI. 
 * 
 * CURRENT (Phase 1): Simple chat with prompt engineering.
 * PHASE 2: Agent will use RAG (retrieve game data) + Tools + ReAct loop
 * PHASE 3: Multi-agent orchestration — different specialist agents
 * 
 * React concepts used:
 * - useState: manages messages, input text, loading state
 * - useRef: auto-scrolls to bottom, focuses input after send
 * - useEffect: triggers scroll whenever messages change
 */

export default function Chat() {
  // STATE — these are React's way of tracking data that changes
  // When state changes, React automatically re-renders the component
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to the Nexus. I'm your AI gaming companion — I know MOBAs, FPS, strategy, sandbox, and everything in between. Ask me for game recs, strategy tips, build guides, or just talk gaming. What's on your mind? 🎮"
    }
  ]);
  const [input, setInput] = useState('');           // What the user is typing
  const [isLoading, setIsLoading] = useState(false); // Is the AI thinking?

  // REFS — direct references to DOM elements (like document.getElementById in vanilla JS)
  const messagesEndRef = useRef(null);  // Points to bottom of chat
  const inputRef = useRef(null);        // Points to the text input

  // EFFECT — runs whenever messages array changes
  // Scrolls to the newest message automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // HANDLER — called when user sends a message
  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return; // Don't send empty or while loading

    // 1. Add user message to chat immediately (optimistic update)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');        // Clear input
    setIsLoading(true);  // Show loading animation

    try {
      // 2. Send to our Flask backend → which sends to Gemini
      const data = await sendMessage(userMessage);

      // 3. Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      // 4. Handle errors gracefully
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Connection lost. Make sure the backend server is running (python app.py on port 5000)."
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus(); // Put cursor back in input
    }
  };

  // Send on Enter key (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      
      {/* Chat Header */}
      <div className="border-b border-nox-border bg-nox-dark/80 backdrop-blur-sm p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nox-red-glow border border-nox-red/20 flex items-center justify-center">
            <RiRobot2Line className="text-nox-red text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Nexus AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-nox-green animate-pulse"></span>
              <p className="text-xs text-nox-muted">Powered by Gemini — Phase 1: Prompt Engineering</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {/* AI avatar */}
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-nox-red-glow border border-nox-red/20 flex items-center justify-center shrink-0 mt-1">
                <RiRobot2Line className="text-nox-red text-sm" />
              </div>
            )}

            {/* Message bubble */}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-nox-red text-white rounded-br-sm'
                : 'bg-nox-card border border-nox-border text-nox-text rounded-bl-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>

            {/* User avatar */}
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-nox-hover border border-nox-border flex items-center justify-center shrink-0 mt-1">
                <RiUser3Line className="text-nox-muted text-sm" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Animation — Three bouncing dots */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-nox-red-glow border border-nox-red/20 flex items-center justify-center shrink-0">
              <RiRobot2Line className="text-nox-red text-sm" />
            </div>
            <div className="bg-nox-card border border-nox-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-nox-red rounded-full" style={{ animation: 'bounce-dot 1.4s ease-in-out infinite', animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-nox-red rounded-full" style={{ animation: 'bounce-dot 1.4s ease-in-out infinite', animationDelay: '200ms' }}></span>
                <span className="w-2 h-2 bg-nox-red rounded-full" style={{ animation: 'bounce-dot 1.4s ease-in-out infinite', animationDelay: '400ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-nox-border bg-nox-dark/80 backdrop-blur-sm p-4 shrink-0">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nexus AI anything about gaming..."
            rows={1}
            className="flex-1 bg-nox-card border border-nox-border rounded-xl px-4 py-3 text-sm text-white 
                       placeholder-nox-muted resize-none focus:outline-none focus:border-nox-red/50 
                       transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-nox-red hover:bg-nox-red-bright disabled:opacity-20 
                       disabled:cursor-not-allowed rounded-xl text-white transition-all duration-200 
                       hover:shadow-[0_0_20px_rgba(255,45,85,0.3)]"
          >
            <RiSendPlaneFill className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}