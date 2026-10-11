export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mesh">
      {/* Floating blobs */}
      <div
        className="animate-float absolute -top-32 -left-24 h-[60vw] w-[60vw] max-h-[520px] max-w-[520px] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--glow) 60%, transparent), transparent 65%)" }}
      />
      <div
        className="animate-float-slower absolute top-1/3 -right-24 h-[55vw] w-[55vw] max-h-[480px] max-w-[480px] rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--glow-2) 60%, transparent), transparent 65%)" }}
      />
      <div
        className="animate-float absolute -bottom-24 left-1/4 h-[50vw] w-[50vw] max-h-[440px] max-w-[440px] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 55%, transparent), transparent 65%)" }}
      />

      {/* Drifting mesh sheen */}
      <div
        className="animate-drift absolute inset-[-20%] opacity-30 mix-blend-screen"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, color-mix(in oklab, var(--glow) 25%, transparent), transparent, color-mix(in oklab, var(--glow-2) 22%, transparent), transparent)",
          filter: "blur(60px)",
        }}
      />

      {/* Noise */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06] mix-blend-overlay">
        <filter id="n">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>

      {/* Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-1 w-1 rounded-full"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              background: "color-mix(in oklab, var(--glow) 80%, white)",
              boxShadow: "0 0 12px 2px color-mix(in oklab, var(--glow) 60%, transparent)",
              animation: `float-slow ${8 + (i % 6)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}
