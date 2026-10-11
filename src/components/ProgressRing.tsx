interface Props {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
}

export function ProgressRing({ value, size = 180, stroke = 14, label, sub }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (clamped / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="60%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--glow-2)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
          strokeWidth={stroke} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{
            transition: "stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)",
            filter: "drop-shadow(0 0 12px color-mix(in oklab, var(--glow) 60%, transparent))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold tracking-tight text-gradient">{Math.round(clamped)}%</div>
        {label && <div className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</div>}
        {sub && <div className="text-[10px] text-muted-foreground/70">{sub}</div>}
      </div>
    </div>
  );
}
