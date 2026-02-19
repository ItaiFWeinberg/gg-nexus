function generateParticles() {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: (i * 3.33 + i * 7.1) % 100,
    delay: (i * 1.7) % 15,
    duration: 15 + (i * 2.3) % 20,
    size: 1 + (i * 0.8) % 3,
    opacity: 0.1 + (i * 0.04) % 0.3,
  }));
}

const PARTICLES = generateParticles();

export default function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {PARTICLES.map((p) => (
        <div key={p.id} className="absolute rounded-full bg-nox-red"
          style={{
            left: `${p.left}%`,
            bottom: '-5%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `particle-float ${p.duration}s linear ${p.delay}s infinite`,
          }} />
      ))}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nox-red/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-nox-red/3 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-nox-red/3 rounded-full blur-3xl" />
    </div>
  );
}