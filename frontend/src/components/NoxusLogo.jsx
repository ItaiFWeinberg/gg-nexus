export default function NoxusLogo({ size = 40, animated = false }) {
  return (
    <div className={animated ? 'animate-pulse-glow' : ''} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer glow */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2d55" />
            <stop offset="100%" stopColor="#ff6b8a" />
          </linearGradient>
        </defs>
        
        {/* Outer hexagonal shield */}
        <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" fill="#0c0c1a" stroke="url(#redGrad)" strokeWidth="2" filter="url(#glow)" />
        
        {/* Inner diamond with glow */}
        <path d="M50 22L73 50L50 78L27 50L50 22Z" fill="rgba(255,45,85,0.08)" stroke="#ff2d55" strokeWidth="1.5" opacity="0.8" />
        
        {/* Inner smaller diamond */}
        <path d="M50 35L62 50L50 65L38 50L50 35Z" fill="rgba(255,45,85,0.15)" stroke="#ff2d55" strokeWidth="0.5" opacity="0.5" />
        
        {/* GG text */}
        <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fill="#ff2d55" fontSize="20" fontWeight="900" fontFamily="Orbitron, monospace" letterSpacing="2" filter="url(#glow)">GG</text>
        
        {/* NEXUS text */}
        <text x="50" y="63" textAnchor="middle" dominantBaseline="middle" fill="#7070a0" fontSize="8" fontWeight="600" fontFamily="Orbitron, monospace" letterSpacing="4">NEXUS</text>
        
        {/* Corner accents */}
        <line x1="20" y1="15" x2="35" y2="10" stroke="#ff2d55" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="10" x2="80" y2="15" stroke="#ff2d55" strokeWidth="1" opacity="0.4" />
        <line x1="20" y1="85" x2="35" y2="90" stroke="#ff2d55" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="90" x2="80" y2="85" stroke="#ff2d55" strokeWidth="1" opacity="0.4" />
      </svg>
    </div>
  );
}