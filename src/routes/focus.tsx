import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeSync } from "@/components/ThemeSync";
import { useStudyStore } from "@/lib/study-store";
import { Play, Pause, Check, ArrowLeft } from "lucide-react";
import { ProgressRing } from "@/components/ProgressRing";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/focus")({ component: Focus });

function Focus() {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = useStudyStore((s) => s.tasks);
  const toggle = useStudyStore((s) => s.toggleComplete);
  const current = tasks.find((t) => t.date === today && t.status !== "completed");

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (running) ref.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    else if (ref.current) window.clearInterval(ref.current);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);

  const total = (current?.estimatedMin ?? 45) * 60;
  const pct = Math.min(100, (seconds / total) * 100);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6">
      <ThemeSync />
      <AnimatedBackground />
      <Link to="/" className="glass absolute left-4 top-6 flex items-center gap-1 rounded-full px-3 py-2 text-xs">
        <ArrowLeft className="h-4 w-4" /> Exit
      </Link>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Focus Mode</div>
      <h1 className="mt-2 max-w-xs text-center text-2xl font-bold text-gradient">
        {current?.title ?? "Nothing to focus — enjoy the win"}
      </h1>
      <div className="mt-6">
        <ProgressRing value={pct} size={240} stroke={16} label={`${mm}:${ss}`} sub={current?.category} />
      </div>
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex h-16 w-16 items-center justify-center rounded-full glow-primary"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
        >
          {running ? <Pause className="h-7 w-7 text-primary-foreground" /> : <Play className="h-7 w-7 text-primary-foreground" />}
        </button>
        {current && (
          <button onClick={() => { toggle(current.id); setRunning(false); }}
            className="glass flex h-16 w-16 items-center justify-center rounded-full">
            <Check className="h-7 w-7" style={{ color: "var(--primary)" }} />
          </button>
        )}
      </div>
      <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground">
        Everything else is hidden. One task. One timer. Deep work.
      </p>
    </div>
  );
}

