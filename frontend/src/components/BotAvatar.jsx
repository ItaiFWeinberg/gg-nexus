/**
 * BotAvatar — Nexus Spirit: A fantasy warrior entity
 * 
 * Design: Glowing ethereal helmet/mask with energy effects
 * Think: Hollow Knight meets Noxus — a floating spectral warrior head
 */

export default function BotAvatar({ mood = 'idle', size = 120 }) {
  const glowOpacity = {
    idle: 0.3, thinking: 0.5, happy: 0.6, empathy: 0.25, excited: 0.7
  };

  const eyeColor = {
    idle: '#ff2d55', thinking: '#ff6b8a', happy: '#ff4d6d', empathy: '#ff8fa3', excited: '#ff1a44'
  };

  const animClass = mood === 'thinking' ? 'animate-pulse' : 'animate-float';

  return (
    <div className={`relative ${animClass}`} style={{ width: size, height: size }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full blur-xl transition-all duration-700"
        style={{ background: `radial-gradient(circle, rgba(255,45,85,${glowOpacity[mood]}) 0%, transparent 70%)` }} />

      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <filter id="nGlow"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="nGlowStrong"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="helmGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#1a1a35" />
            <stop offset="100%" stopColor="#0a0a18" />
          </linearGradient>
          <linearGradient id="hornGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1a1a35" />
            <stop offset="100%" stopColor="#2a1a2a" />
          </linearGradient>
        </defs>

        {/* Energy particles */}
        <circle cx="18" cy="45" r="1" fill="#ff2d55" opacity="0.4">
          <animate attributeName="cy" values="45;35;45" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="82" cy="40" r="0.8" fill="#ff2d55" opacity="0.3">
          <animate attributeName="cy" values="40;30;40" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="65" r="0.6" fill="#ff2d55" opacity="0.3">
          <animate attributeName="cy" values="65;58;65" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="78" cy="62" r="0.7" fill="#ff2d55" opacity="0.2">
          <animate attributeName="cy" values="62;55;62" dur="4.5s" repeatCount="indefinite" />
        </circle>

        {/* Left horn */}
        <path d="M28 42L18 18L32 35Z" fill="url(#hornGrad)" stroke="#ff2d55" strokeWidth="0.8" opacity="0.9" filter="url(#nGlow)" />
        <path d="M22 28L18 18L25 25Z" fill="#ff2d55" opacity="0.15" />

        {/* Right horn */}
        <path d="M72 42L82 18L68 35Z" fill="url(#hornGrad)" stroke="#ff2d55" strokeWidth="0.8" opacity="0.9" filter="url(#nGlow)" />
        <path d="M78 28L82 18L75 25Z" fill="#ff2d55" opacity="0.15" />

        {/* Helmet base — angular warrior shape */}
        <path d="M50 25 L72 38 L75 58 L65 72 L50 76 L35 72 L25 58 L28 38 Z"
          fill="url(#helmGrad)" stroke="#ff2d55" strokeWidth="1.2" filter="url(#nGlow)" />

        {/* Helmet inner detail — V shaped visor line */}
        <path d="M35 42 L50 50 L65 42" stroke="#ff2d55" strokeWidth="0.8" fill="none" opacity="0.4" />

        {/* Forehead crest */}
        <path d="M42 30 L50 25 L58 30 L50 34 Z" fill="#ff2d55" opacity="0.15" stroke="#ff2d55" strokeWidth="0.5" />

        {/* Left eye */}
        <g filter="url(#nGlowStrong)">
          {mood === 'happy' ? (
            <path d={`M37 ${44} Q41 ${40} 45 ${44}`} stroke={eyeColor[mood]} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            <ellipse cx="41" cy={mood === 'excited' ? 42 : 44} rx={mood === 'excited' ? 5 : 4}
              ry={mood === 'empathy' ? 3 : mood === 'excited' ? 5 : 3.5}
              fill={eyeColor[mood]}>
              {mood === 'thinking' && <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />}
            </ellipse>
          )}
          {mood !== 'happy' && mood !== 'thinking' && (
            <circle cx={mood === 'excited' ? 42 : 41.5} cy={mood === 'excited' ? 42 : 44} r={mood === 'excited' ? 2 : 1.5} fill="#fff" opacity="0.9">
              {mood === 'excited' && <animate attributeName="r" values="2;2.5;2" dur="0.8s" repeatCount="indefinite" />}
            </circle>
          )}
        </g>

        {/* Right eye */}
        <g filter="url(#nGlowStrong)">
          {mood === 'happy' ? (
            <path d={`M55 ${44} Q59 ${40} 63 ${44}`} stroke={eyeColor[mood]} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            <ellipse cx="59" cy={mood === 'excited' ? 42 : 44} rx={mood === 'excited' ? 5 : 4}
              ry={mood === 'empathy' ? 3 : mood === 'excited' ? 5 : 3.5}
              fill={eyeColor[mood]}>
              {mood === 'thinking' && <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" begin="0.3s" />}
            </ellipse>
          )}
          {mood !== 'happy' && mood !== 'thinking' && (
            <circle cx={mood === 'excited' ? 58 : 58.5} cy={mood === 'excited' ? 42 : 44} r={mood === 'excited' ? 2 : 1.5} fill="#fff" opacity="0.9">
              {mood === 'excited' && <animate attributeName="r" values="2;2.5;2" dur="0.8s" repeatCount="indefinite" begin="0.2s" />}
            </circle>
          )}
        </g>

        {/* Mouth area */}
        {mood === 'happy' && (
          <path d="M44 56 Q50 61 56 56" stroke="#ff2d55" strokeWidth="1.2" fill="none" opacity="0.7" filter="url(#nGlow)" />
        )}
        {mood === 'excited' && (
          <path d="M43 55 Q50 63 57 55" stroke="#ff2d55" strokeWidth="1.5" fill="rgba(255,45,85,0.1)" filter="url(#nGlow)" />
        )}
        {mood === 'empathy' && (
          <line x1="45" y1="57" x2="55" y2="57" stroke="#ff2d55" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
        )}
        {mood === 'thinking' && (
          <>
            <circle cx="46" cy="58" r="1.2" fill="#ff2d55" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" /></circle>
            <circle cx="50" cy="58" r="1.2" fill="#ff2d55" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" begin="0.2s" /></circle>
            <circle cx="54" cy="58" r="1.2" fill="#ff2d55" opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" begin="0.4s" /></circle>
          </>
        )}

        {/* Chin guard */}
        <path d="M38 65 L50 72 L62 65" stroke="#ff2d55" strokeWidth="0.6" fill="none" opacity="0.3" />

        {/* Side vents */}
        <line x1="27" y1="48" x2="32" y2="46" stroke="#ff2d55" strokeWidth="0.5" opacity="0.3" />
        <line x1="27" y1="52" x2="32" y2="50" stroke="#ff2d55" strokeWidth="0.5" opacity="0.3" />
        <line x1="73" y1="48" x2="68" y2="46" stroke="#ff2d55" strokeWidth="0.5" opacity="0.3" />
        <line x1="73" y1="52" x2="68" y2="50" stroke="#ff2d55" strokeWidth="0.5" opacity="0.3" />

        {/* Energy wisps from helmet */}
        <path d="M50 25 Q48 15 50 10" stroke="#ff2d55" strokeWidth="0.5" fill="none" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M45 27 Q42 18 44 12" stroke="#ff2d55" strokeWidth="0.4" fill="none" opacity="0.2">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3.5s" repeatCount="indefinite" />
        </path>
        <path d="M55 27 Q58 18 56 12" stroke="#ff2d55" strokeWidth="0.4" fill="none" opacity="0.2">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}