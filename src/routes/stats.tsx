import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/lib/study-store";
import { ProgressRing } from "@/components/ProgressRing";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/stats")({ component: Stats });

function Stats() {
  const tasks = useStudyStore((s) => s.tasks);
  const streak = useStudyStore((s) => s.streak);

  const byDay: Record<string, { day: string; done: number; planned: number }> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const short = d.toLocaleDateString(undefined, { weekday: "short" });
    byDay[key] = { day: short, done: 0, planned: 0 };
  }
  for (const t of tasks) {
    if (byDay[t.date]) {
      byDay[t.date].planned++;
      if (t.status === "completed") byDay[t.date].done++;
    }
  }
  const weekData = Object.values(byDay);

  const total = tasks.length || 1;
  const done = tasks.filter((t) => t.status === "completed").length;
  const accuracy = Math.round((done / total) * 100);
  const present = tasks.filter((t) => t.attendance === "present").length;
  const attTotal = tasks.filter((t) => t.attendance).length || 1;
  const attendance = Math.round((present / attTotal) * 100);

  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Analytics</div>
        <h1 className="text-3xl font-bold text-gradient">Your Stats</h1>
      </header>

      <div className="glass-strong glow-primary flex items-center gap-5 rounded-3xl p-5">
        <ProgressRing value={accuracy} size={140} stroke={12} label="Accuracy" sub="all-time" />
        <div className="flex-1 space-y-2">
          <Row label="Streak" value={`${streak} days`} />
          <Row label="Attendance" value={`${attendance}%`} />
          <Row label="Completed" value={`${done}`} />
          <Row label="Planned" value={`${total}`} />
        </div>
      </div>

      <section className="mt-4 glass rounded-3xl p-4">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">This Week — Completion</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} barGap={4}>
              <XAxis dataKey="day" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "color-mix(in oklab, var(--foreground) 6%, transparent)" }}
                contentStyle={{
                  background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12,
                }}
              />
              <Bar dataKey="planned" fill="color-mix(in oklab, var(--muted-foreground) 40%, transparent)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="done" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-4 glass rounded-3xl p-4">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Focus Trend</div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekData}>
              <XAxis dataKey="day" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="done" stroke="var(--accent)" strokeWidth={3} dot={{ fill: "var(--primary)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-gradient">{value}</span>
    </div>
  );
}
