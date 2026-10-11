import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/lib/study-store";

export const Route = createFileRoute("/attendance")({ component: Attendance });

function Attendance() {
  const tasks = useStudyStore((s) => s.tasks);
  const today = new Date().toISOString().slice(0, 10);

  // Group tasks by date
  const byDate = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date)!.push(t);
  }

  // Today attendance: 100% only if every planned task today is completed, else 0%.
  const todays = byDate.get(today) ?? [];
  const pct = todays.length > 0 && todays.every((t) => t.status === "completed") ? 100 : 0;

  // Counts across all time (for stat chips)
  const counts = { present: 0, absent: 0 };
  for (const [, list] of byDate) {
    if (list.length === 0) continue;
    const allDone = list.every((t) => t.status === "completed");
    if (allDone) counts.present++; else counts.absent++;
  }

  // Month cells: green when every task that day is completed
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const byDay: Record<string, number> = {};
  for (let i = 1; i <= days; i++) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const list = byDate.get(key) ?? [];
    byDay[key] = list.length > 0 && list.every((t) => t.status === "completed") ? 1 : 0;
  }

  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Discipline</div>
        <h1 className="text-3xl font-bold text-gradient">Attendance</h1>
      </header>

      <div className="glass-strong glow-primary mb-4 rounded-3xl p-5 text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Overall</div>
        <div className="mt-1 text-5xl font-bold text-gradient">{pct}%</div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Cell label="Present Days" val={counts.present} />
        <Cell label="Absent Days" val={counts.absent} />
      </div>

      <section className="glass rounded-3xl p-4">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">This month</div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: days }).map((_, i) => {
            const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            const c = byDay[key] ?? 0;
            return (
              <div key={key} className="flex aspect-square items-center justify-center rounded-lg text-[10px] font-medium"
                style={{
                  background: c
                    ? `linear-gradient(135deg, color-mix(in oklab, var(--primary) 50%, transparent), color-mix(in oklab, var(--accent) 50%, transparent))`
                    : "color-mix(in oklab, var(--foreground) 5%, transparent)",
                  color: c ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}>
                {i + 1}
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function Cell({ label, val }: { label: string; val: number }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div className="text-lg font-bold text-gradient">{val}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
