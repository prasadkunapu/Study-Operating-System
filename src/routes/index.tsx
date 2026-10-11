import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { useStudyStore, QUOTES } from "@/lib/study-store";
import { Flame, CheckCircle2, Target, Clock, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { to12Hour } from "@/lib/time-format";

export const Route = createFileRoute("/")({
  component: Home,
});

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

import { greetingFor } from "@/lib/greeting";


function Home() {
  const now = useNow();
  const tasks = useStudyStore((s) => s.tasks);
  const streak = useStudyStore((s) => s.streak);
  const today = now.toISOString().slice(0, 10);
  const todays = tasks.filter((t) => t.date === today);
  const done = todays.filter((t) => t.status === "completed").length;
  const progress = todays.length ? (done / todays.length) * 100 : 0;
  const upcoming = todays.find((t) => t.status !== "completed");
  const quote = QUOTES[now.getDate() % QUOTES.length];

  const present = tasks.filter((t) => t.attendance === "present").length;
  const total = tasks.filter((t) => t.attendance).length || 1;
  const attendance = Math.round((present / total) * 100);

  const planned = tasks.length || 1;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const accuracy = Math.round((completed / planned) * 100);

  return (
    <AppShell>
      {/* Hero */}
      <section className="animate-fade-up">
        <div className="flex items-baseline justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </div>
            <h1 className="mt-1 truncate text-3xl font-bold sm:text-4xl">
              <span className="text-gradient">{greetingFor(now.getHours())}</span>
            </h1>
          </div>
          <div className="glass shrink-0 rounded-2xl px-3 py-2 text-right">
            <div className="text-lg font-semibold tabular-nums">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {now.toLocaleTimeString([], { hour: "2-digit", hour12: true }).includes("AM") ? "AM" : "PM"}
            </div>
          </div>
        </div>

        {/* Progress hero */}
        <div className="glass-strong glow-primary mt-5 rounded-3xl p-5">
          <div className="flex items-center gap-5">
            <ProgressRing value={progress} size={148} stroke={12} label="Today" sub={`${done}/${todays.length} tasks`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
                Today's Goal
              </div>
              <div className="mt-1 line-clamp-2 text-base font-semibold">
                {upcoming ? upcoming.title : "All planned tasks done — take a breath."}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]">
                  <Flame className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
                  <span className="font-semibold">{streak}</span>
                  <span className="text-muted-foreground">day streak</span>
                </div>
                <Link to="/plan" className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium">
                  Open plan <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Attendance" value={`${attendance}%`} />
        <StatCard icon={<Target className="h-4 w-4" />} label="Accuracy" value={`${accuracy}%`} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={String(completed)} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Streak" value={`${streak}d`} />
      </section>

      {/* Quote */}
      <section className="mt-4">
        <div className="glass rounded-3xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Today's Quote</div>
          <blockquote className="mt-1 text-base font-medium leading-relaxed">
            "{quote}"
          </blockquote>
        </div>
      </section>

      {/* Upcoming */}
      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Upcoming</h2>
          <Link to="/plan" className="text-xs text-muted-foreground">View all</Link>
        </div>
        <div className="space-y-2">
          {todays.filter((t) => t.status !== "completed").slice(0, 3).map((t) => (
            <div key={t.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 20%, var(--card)), var(--card))" }}>
                <div className="text-[10px] uppercase text-muted-foreground">{to12Hour(t.time).split(" ")[0]}</div>
                <div className="text-[9px] font-semibold" style={{ color: "var(--primary)" }}>{to12Hour(t.time).split(" ")[1]}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{t.category}</span>
                  <span>·</span>
                  <span>{t.estimatedMin} min</span>
                </div>
              </div>
              <PriorityDot p={t.priority} />
            </div>
          ))}
          {todays.length === 0 && (
            <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
              No tasks scheduled. Add one in the Plan.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
        <span style={{ color: "var(--primary)" }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-gradient">{value}</div>
    </div>
  );
}

function PriorityDot({ p }: { p: string }) {
  const map: Record<string, string> = {
    critical: "var(--destructive)",
    high: "var(--primary)",
    medium: "var(--accent)",
    low: "var(--muted-foreground)",
  };
  return (
    <span className="h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: map[p], boxShadow: `0 0 10px ${map[p]}` }} />
  );
}
