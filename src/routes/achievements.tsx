import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/lib/study-store";
import { Trophy, Flame, CheckCircle2, Star, Sparkles, Target } from "lucide-react";

export const Route = createFileRoute("/achievements")({ component: Achievements });

function Achievements() {
  const tasks = useStudyStore((s) => s.tasks);
  const topics = useStudyStore((s) => s.topics);
  const streak = useStudyStore((s) => s.streak);
  const done = tasks.filter((t) => t.status === "completed").length;
  const mastered = topics.filter((t) => t.status === "mastered").length;

  const badges = [
    { id: "s7", label: "7 Day Streak", got: streak >= 7, icon: Flame, req: 7, cur: streak },
    { id: "s30", label: "30 Day Streak", got: streak >= 30, icon: Flame, req: 30, cur: streak },
    { id: "s100", label: "100 Day Streak", got: streak >= 100, icon: Flame, req: 100, cur: streak },
    { id: "c50", label: "50 Tasks", got: done >= 50, icon: CheckCircle2, req: 50, cur: done },
    { id: "c200", label: "200 Tasks", got: done >= 200, icon: CheckCircle2, req: 200, cur: done },
    { id: "t20", label: "20 Topics", got: mastered >= 20, icon: Star, req: 20, cur: mastered },
    { id: "t100", label: "100 Topics", got: mastered >= 100, icon: Sparkles, req: 100, cur: mastered },
    { id: "goal", label: "Perfect Day", got: done > 0, icon: Target, req: 1, cur: done },
  ];

  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Trophy Case</div>
        <h1 className="text-3xl font-bold text-gradient">Achievements</h1>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((b) => {
          const Icon = b.icon;
          const pct = Math.min(100, (b.cur / b.req) * 100);
          return (
            <div key={b.id} className={`glass rounded-2xl p-4 ${b.got ? "glow-primary" : ""}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: b.got
                    ? "linear-gradient(135deg, var(--primary), var(--accent))"
                    : "color-mix(in oklab, var(--foreground) 6%, transparent)",
                }}>
                <Icon className={`h-5 w-5 ${b.got ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div className="mt-2 text-sm font-semibold">{b.label}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">{b.cur}/{b.req}</div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--accent))",
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="glass mt-4 flex items-center gap-3 rounded-2xl p-4">
        <Trophy className="h-6 w-6" style={{ color: "var(--primary)" }} />
        <div className="text-xs text-muted-foreground">
          Complete every task in a day to increase your streak. Missed tasks auto-move to tomorrow.
        </div>
      </div>
    </AppShell>
  );
}
