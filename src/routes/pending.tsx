import { createFileRoute } from "@tanstack/react-router";
import { to12Hour } from "@/lib/time-format";
import { AppShell } from "@/components/AppShell";
import { useStudyStore, type Priority } from "@/lib/study-store";

export const Route = createFileRoute("/pending")({ component: Pending });

const COLUMNS: Priority[] = ["critical", "high", "medium", "low"];

function Pending() {
  const tasks = useStudyStore((s) => s.tasks).filter((t) => t.status !== "completed");
  const colors: Record<Priority, string> = {
    critical: "var(--destructive)", high: "var(--primary)", medium: "var(--accent)", low: "var(--muted-foreground)",
  };
  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Kanban Board</div>
        <h1 className="text-3xl font-bold text-gradient">Pending</h1>
      </header>
      <div className="space-y-4">
        {COLUMNS.map((p) => {
          const list = tasks.filter((t) => t.priority === p);
          return (
            <section key={p} className="glass rounded-2xl p-3">
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="h-2 w-2 rounded-full" style={{ background: colors[p], boxShadow: `0 0 10px ${colors[p]}` }} />
                <div className="text-xs font-semibold uppercase tracking-widest">{p}</div>
                <div className="ml-auto text-[10px] text-muted-foreground">{list.length}</div>
              </div>
              <div className="space-y-2">
                {list.map((t) => (
                  <div key={t.id} className="glass rounded-xl p-3">
                    <div className="text-sm font-semibold">{t.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{t.category} · {to12Hour(t.time)} · {t.estimatedMin}m</div>
                  </div>
                ))}
                {list.length === 0 && <div className="rounded-xl p-3 text-center text-xs text-muted-foreground">Empty</div>}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
