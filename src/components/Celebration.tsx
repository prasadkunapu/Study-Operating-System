import { useEffect, useState } from "react";
import { useStudyStore } from "@/lib/study-store";
import { Trophy, Sparkles } from "lucide-react";

export function Celebration() {
  const tasks = useStudyStore((s) => s.tasks);
  const bump = useStudyStore((s) => s.bumpStreakIfNeeded);
  const [show, setShow] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const todays = tasks.filter((t) => t.date === today);
  const done = todays.filter((t) => t.status === "completed").length;
  const allDone = todays.length > 0 && done === todays.length;

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => {
        setShow(true);
        bump();
        const h = setTimeout(() => setShow(false), 5200);
        return () => clearTimeout(h);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [allDone, bump]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="glass-strong glow-primary relative w-full max-w-sm animate-fade-up rounded-3xl p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full glow-primary"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Mission Complete</div>
        <div className="mt-1 text-2xl font-bold text-gradient">100% Achieved</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Every task done. Streak extended. Keep the fire.
        </p>
        <div className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} /> Achievement unlocked
        </div>
      </div>
      {/* Confetti particles */}
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="pointer-events-none absolute h-2 w-2 rounded-sm"
          style={{
            top: `${(i * 13) % 100}%`,
            left: `${(i * 29) % 100}%`,
            background: i % 2 ? "var(--primary)" : "var(--accent)",
            boxShadow: "0 0 12px 2px color-mix(in oklab, var(--glow) 60%, transparent)",
            animation: `float-slow ${1.5 + (i % 5) * 0.3}s ease-in-out ${i * 0.05}s infinite`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}
