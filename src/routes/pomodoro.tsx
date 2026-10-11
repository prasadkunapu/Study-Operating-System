import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { Play, Pause, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/pomodoro")({ component: Pomodoro });

const PRESETS = [25, 50, 90];

function Pomodoro() {
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => { setLeft(minutes * 60); setRunning(false); }, [minutes]);

  useEffect(() => {
    if (running) ref.current = window.setInterval(() => setLeft((s) => {
      if (s <= 1) { setRunning(false); setSessions((n) => n + 1); return 0; }
      return s - 1;
    }), 1000);
    else if (ref.current) window.clearInterval(ref.current);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);

  const pct = ((minutes * 60 - left) / (minutes * 60)) * 100;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Deep Work</div>
        <h1 className="text-3xl font-bold text-gradient">Pomodoro</h1>
      </header>

      <div className="glass-strong glow-primary flex flex-col items-center rounded-3xl p-6">
        <ProgressRing value={pct} size={220} stroke={16} label={`${mm}:${ss}`} sub={`${minutes} min session`} />
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex h-14 w-14 items-center justify-center rounded-full glow-primary"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
          >
            {running ? <Pause className="h-6 w-6 text-primary-foreground" /> : <Play className="h-6 w-6 text-primary-foreground" />}
          </button>
          <button onClick={() => { setLeft(minutes * 60); setRunning(false); }}
            className="glass flex h-14 w-14 items-center justify-center rounded-full">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {PRESETS.map((m) => (
            <button key={m} onClick={() => setMinutes(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                minutes === m ? "text-primary-foreground glow-primary" : "glass text-muted-foreground"
              }`}
              style={minutes === m ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}>
              {m} min
            </button>
          ))}
          <label className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Custom</span>
            <input type="number" value={minutes} min={1} onChange={(e) => setMinutes(Math.max(1, +e.target.value))}
              className="w-14 bg-transparent text-center font-semibold outline-none" />
          </label>
        </div>
      </div>

      <div className="glass mt-4 flex items-center justify-between rounded-2xl p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Sessions today</div>
        <div className="text-2xl font-bold text-gradient">{sessions}</div>
      </div>
    </AppShell>
  );
}
