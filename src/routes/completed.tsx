import { createFileRoute } from "@tanstack/react-router";
import { to12Hour } from "@/lib/time-format";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/lib/study-store";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/completed")({ component: Completed });

function Completed() {
  const tasks = useStudyStore((s) => s.tasks).filter((t) => t.status === "completed");
  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Achievements</div>
        <h1 className="text-3xl font-bold text-gradient">Completed</h1>
      </header>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="glass flex items-center gap-3 rounded-2xl p-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--primary)" }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{t.title}</div>
              <div className="text-[11px] text-muted-foreground">{t.category} · {t.date} · {to12Hour(t.time)}</div>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.estimatedMin}m</div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">Nothing completed yet.</div>
        )}
      </div>
    </AppShell>
  );
}
