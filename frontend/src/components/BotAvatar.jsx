/**
 * BotAvatar — Nexus Spirit: Fantasy warrior entity
 * 
 * Moods: idle, thinking, happy, empathy, excited, curious, proud, frustrated
 * Each mood changes: eye shape, glow, mouth, particle intensity
 */

export default function BotAvatar({ mood = 'idle', size = 120 }) {
 const config = {
    idle:       { glow: 0.25, eyeColor: '#ff2d55', pupil: true,  mouthType: 'none',    anim: 'animate-float' },
    thinking:   { glow: 0.45, eyeColor: '#ff6b8a', pupil: false, mouthType: 'dots',    anim: 'animate-pulse' },
    happy:      { glow: 0.55, eyeColor: '#ff4d6d', pupil: false, mouthType: 'smile',   anim: 'animate-float' },
    empathy:    { glow: 0.2,  eyeColor: '#ff8fa3', pupil: true,  mouthType: 'flat',    anim: 'animate-float' },
    excited:    { glow: 0.7,  eyeColor: '#ff1a44', pupil: true,  mouthType: 'open',    anim: '' },
    curious:    { glow: 0.35, eyeColor: '#ff5577', pupil: true,  mouthType: 'none',    anim: 'animate-float' },
    proud:      { glow: 0.6,  eyeColor: '#ff2d55', pupil: false, mouthType: 'smile',   anim: 'animate-float' },
    frustrated: { glow: 0.3,  eyeColor: '#cc2244', pupil: true,  mouthType: 'zigzag',  anim: '' },
    playful:    { glow: 0.5,  eyeColor: '#ff6b8a', pupil: true,  mouthType: 'smile',   anim: 'animate-float' },
    intense:    { glow: 0.65, eyeColor: '#ff0033', pupil: true,  mouthType: 'flat',    anim: '' },
    supportive: { glow: 0.4,  eyeColor: '#ff6b8a', pupil: false, mouthType: 'smile',   anim: 'animate-float' },
    impressed:  { glow: 0.7,  eyeColor: '#ff2d55', pupil: true,  mouthType: 'open',    anim: '' },
  };

  const c = config[mood] || config.idle;

  // Eye geometry per mood
  const eyeShape = {
    idle:       { ry: 3.5, rx: 4 },
    thinking:   { ry: 3, rx: 5 },
    happy:      { ry: 0, rx: 0 },
    empathy:    { ry: 4, rx: 3.5 },
    excited:    { ry: 5.5, rx: 5 },
    curious:    { ry: 4.5, rx: 3.5 },
    proud:      { ry: 0, rx: 0 },
    frustrated: { ry: 2.5, rx: 5 },
    playful:    { ry: 0, rx: 0 },
    intense:    { ry: 3, rx: 5.5 },
    supportive: { ry: 0, rx: 0 },
    impressed:  { ry: 6, rx: 5 },
  };

  const eye = eyeShape[mood] || eyeShape.idle;
  const isArcEye = mood === 'happy' || mood === 'proud' || mood === 'playful' || mood === 'supportive';
  
  return (
    <div className={`relative ${c.anim}`} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-xl transition-all duration-700"
        style={{ background: `radial-gradient(circle, rgba(255,45,85,${c.glow}) 0%, transparent 70%)` }} />

      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <defs>
          <filter id="ng"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="ngs"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="hg" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#1a1a35" /><stop offset="100%" stopColor="#0a0a18" />
          </linearGradient>
          <linearGradient id="hrg" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1a1a35" /><stop offset="100%" stopColor="#2a1a2a" />
          </linearGradient>
        </defs>

        {/* Energy particles — intensity based on mood */}
        {[
          { cx: 18, cy: 45, r: 1, dur: '4s' },
          { cx: 82, cy: 40, r: 0.8, dur: '3.5s' },
          { cx: 25, cy: 65, r: 0.6, dur: '5s' },
          { cx: 78, cy: 62, r: 0.7, dur: '4.5s' },
          { cx: 15, cy: 55, r: 0.5, dur: '6s' },
          { cx: 85, cy: 50, r: 0.5, dur: '5.5s' },
        ].map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r * (c.glow > 0.5 ? 1.5 : 1)} fill="#ff2d55" opacity={c.glow}>
            <animate attributeName="cy" values={`${p.cy};${p.cy - 10};${p.cy}`} dur={p.dur} repeatCount="indefinite" />
            <animate attributeName="opacity" values={`${c.glow * 0.5};${c.glow};${c.glow * 0.5}`} dur={p.dur} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Horns */}
        <path d="M28 42L18 18L32 35Z" fill="url(#hrg)" stroke={c.eyeColor} strokeWidth="0.8" opacity="0.9" filter="url(#ng)" />
        <path d="M22 28L18 18L25 25Z" fill={c.eyeColor} opacity="0.12" />
        <path d="M72 42L82 18L68 35Z" fill="url(#hrg)" stroke={c.eyeColor} strokeWidth="0.8" opacity="0.9" filter="url(#ng)" />
        <path d="M78 28L82 18L75 25Z" fill={c.eyeColor} opacity="0.12" />

        {/* Helmet */}
        <path d="M50 25 L72 38 L75 58 L65 72 L50 76 L35 72 L25 58 L28 38 Z"
          fill="url(#hg)" stroke={c.eyeColor} strokeWidth="1.2" filter="url(#ng)" />

        {/* Visor line */}
        <path d="M35 42 L50 50 L65 42" stroke={c.eyeColor} strokeWidth="0.7" fill="none" opacity="0.35" />

        {/* Forehead crest */}
        <path d="M42 30 L50 25 L58 30 L50 34 Z" fill={c.eyeColor} opacity="0.12" stroke={c.eyeColor} strokeWidth="0.5" />

        {/* Frustrated eyebrows */}
        {mood === 'frustrated' && (
          <>
            <line x1="35" y1="38" x2="44" y2="40" stroke={c.eyeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            <line x1="65" y1="38" x2="56" y2="40" stroke={c.eyeColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </>
        )}

        {/* Curious raised brow */}
        {mood === 'curious' && (
          <path d="M54 37 Q59 34 64 37" stroke={c.eyeColor} strokeWidth="1" fill="none" opacity="0.5" />
        )}

        {/* Left eye */}
        <g filter="url(#ngs)">
          {isArcEye ? (
            <path d="M37 44 Q41 39 45 44" stroke={c.eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            <ellipse cx="41" cy="44" rx={eye.rx} ry={eye.ry} fill={c.eyeColor} className="transition-all duration-300">
              {mood === 'thinking' && <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />}
            </ellipse>
          )}
          {c.pupil && !isArcEye && eye.ry > 0 && (
            <circle cx={mood === 'curious' ? 42.5 : 41.5} cy="44" r={mood === 'excited' ? 2 : 1.5} fill="#fff" opacity="0.9" className="transition-all duration-300">
              {mood === 'excited' && <animate attributeName="r" values="2;2.8;2" dur="0.6s" repeatCount="indefinite" />}
            </circle>
          )}
        </g>

        {/* Right eye */}
        <g filter="url(#ngs)">
          {isArcEye ? (
            <path d="M55 44 Q59 39 63 44" stroke={c.eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            <ellipse cx="59" cy={mood === 'curious' ? 43 : 44} rx={eye.rx} ry={mood === 'curious' ? eye.ry * 1.2 : eye.ry} fill={c.eyeColor} className="transition-all duration-300">
              {mood === 'thinking' && <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" begin="0.3s" />}
            </ellipse>
          )}
          {c.pupil && !isArcEye && eye.ry > 0 && (
            <circle cx={mood === 'curious' ? 60 : 58.5} cy={mood === 'curious' ? 43 : 44} r={mood === 'excited' ? 2 : 1.5} fill="#fff" opacity="0.9" className="transition-all duration-300">
              {mood === 'excited' && <animate attributeName="r" values="2;2.8;2" dur="0.6s" repeatCount="indefinite" begin="0.2s" />}
            </circle>
          )}
        </g>

        {/* Mouth */}
        {c.mouthType === 'smile' && (
          <path d="M44 56 Q50 61 56 56" stroke={c.eyeColor} strokeWidth="1.2" fill="none" opacity="0.7" filter="url(#ng)" />
        )}
        {c.mouthType === 'open' && (
          <path d="M43 55 Q50 63 57 55" stroke={c.eyeColor} strokeWidth="1.5" fill="rgba(255,45,85,0.1)" filter="url(#ng)" />
        )}
        {c.mouthType === 'flat' && (
          <line x1="45" y1="57" x2="55" y2="57" stroke={c.eyeColor} strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
        )}
        {c.mouthType === 'zigzag' && (
          <path d="M43 57 L46 55 L50 58 L54 55 L57 57" stroke={c.eyeColor} strokeWidth="0.8" fill="none" opacity="0.5" />
        )}
        {c.mouthType === 'dots' && (
          <>
            <circle cx="46" cy="58" r="1.2" fill={c.eyeColor} opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" /></circle>
            <circle cx="50" cy="58" r="1.2" fill={c.eyeColor} opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" begin="0.2s" /></circle>
            <circle cx="54" cy="58" r="1.2" fill={c.eyeColor} opacity="0.5"><animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" begin="0.4s" /></circle>
          </>
        )}

        {/* Chin guard */}
        <path d="M38 65 L50 72 L62 65" stroke={c.eyeColor} strokeWidth="0.6" fill="none" opacity="0.25" />

        {/* Side vents */}
        <line x1="27" y1="48" x2="32" y2="46" stroke={c.eyeColor} strokeWidth="0.5" opacity="0.25" />
        <line x1="27" y1="52" x2="32" y2="50" stroke={c.eyeColor} strokeWidth="0.5" opacity="0.25" />
        <line x1="73" y1="48" x2="68" y2="46" stroke={c.eyeColor} strokeWidth="0.5" opacity="0.25" />
        <line x1="73" y1="52" x2="68" y2="50" stroke={c.eyeColor} strokeWidth="0.5" opacity="0.25" />

        {/* Energy wisps */}
        <path d="M50 25 Q48 15 50 10" stroke={c.eyeColor} strokeWidth="0.5" fill="none" opacity={c.glow}>
          <animate attributeName="opacity" values={`${c.glow * 0.5};${c.glow};${c.glow * 0.5}`} dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M45 27 Q42 18 44 12" stroke={c.eyeColor} strokeWidth="0.4" fill="none" opacity={c.glow * 0.7}>
          <animate attributeName="opacity" values={`${c.glow * 0.3};${c.glow * 0.7};${c.glow * 0.3}`} dur="3.5s" repeatCount="indefinite" />
        </path>
        <path d="M55 27 Q58 18 56 12" stroke={c.eyeColor} strokeWidth="0.4" fill="none" opacity={c.glow * 0.7}>
          <animate attributeName="opacity" values={`${c.glow * 0.3};${c.glow * 0.7};${c.glow * 0.3}`} dur="4s" repeatCount="indefinite" />
        </path>

        {/* Excited sparks */}
        {mood === 'excited' && (
          <>
            <circle cx="15" cy="25" r="1.5" fill={c.eyeColor}><animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" /></circle>
            <circle cx="85" cy="30" r="1.2" fill={c.eyeColor}><animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" begin="0.3s" /></circle>
            <circle cx="20" cy="70" r="1" fill={c.eyeColor}><animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" begin="0.5s" /></circle>
          </>
        )}
      </svg>
    </div>
  );
}