export default function NoxusLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer hexagonal shield shape */}
      <path
        d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
        fill="#111118"
        stroke="#ff2d55"
        strokeWidth="2"
      />
      {/* Inner diamond accent */}
      <path
        d="M50 20L75 50L50 80L25 50L50 20Z"
        fill="rgba(255, 45, 85, 0.1)"
        stroke="#ff2d55"
        strokeWidth="1.5"
      />
      {/* GG text */}
      <text
        x="50"
        y="48"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ff2d55"
        fontSize="22"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        letterSpacing="2"
      >
        GG
      </text>
      {/* Small "NEXUS" text below */}
      <text
        x="50"
        y="64"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#6b6b80"
        fontSize="9"
        fontWeight="600"
        fontFamily="Arial, sans-serif"
        letterSpacing="4"
      >
        NEXUS
      </text>
      {/* Top accent line */}
      <line x1="35" y1="12" x2="65" y2="12" stroke="#ff2d55" strokeWidth="1" opacity="0.5" />
      {/* Bottom accent line */}
      <line x1="35" y1="88" x2="65" y2="88" stroke="#ff2d55" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}