import { createFileRoute } from "@tanstack/react-router";
import { to12Hour } from "@/lib/time-format";
import { AppShell } from "@/components/AppShell";
import { useStudyStore, type Task } from "@/lib/study-store";
import { useState } from "react";
import { Pencil, Trash2, X, Trash } from "lucide-react";

export const Route = createFileRoute("/history")({ component: History });

function History() {
  const tasks = useStudyStore((s) => s.tasks);
  const update = useStudyStore((s) => s.updateTask);
  const del = useStudyStore((s) => s.deleteTask);
  const today = new Date().toISOString().slice(0, 10);

  const [editing, setEditing] = useState<Task | null>(null);

  function clearHistory() {
    if (!confirm("Delete all past history records? Today's plan will be kept.")) return;
    for (const t of tasks) {
      if (t.date < today) del(t.id);
    }
  }

  // Group by date (past only for history view)
  const map = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!map.has(t.date)) map.set(t.date, []);
    map.get(t.date)!.push(t);
  }
  const dates = [...map.keys()].sort().reverse();

  // Heatmap: last 90 days
  const now = new Date();
  const cells = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (89 - i));
    const key = d.toISOString().slice(0, 10);
    const list = map.get(key) ?? [];
    const done = list.filter((t) => t.status === "completed").length;
    const intensity = list.length ? Math.min(1, done / list.length) : 0;
    return { key, intensity };
  });

  return (
    <AppShell>
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Timeline</div>
          <h1 className="text-3xl font-bold text-gradient">History</h1>
        </div>
        {dates.length > 0 && (
          <button onClick={clearHistory}
            className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
            <Trash className="h-3.5 w-3.5" /> Clear History
          </button>
        )}
      </header>

      <section className="glass mb-4 rounded-3xl p-4">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">90-day Heatmap</div>
        <div className="grid grid-cols-[repeat(15,1fr)] gap-1">
          {cells.map((c) => (
            <div key={c.key} className="aspect-square rounded-[4px]"
              style={{
                background: c.intensity
                  ? `color-mix(in oklab, var(--primary) ${20 + c.intensity * 70}%, transparent)`
                  : "color-mix(in oklab, var(--foreground) 5%, transparent)",
                boxShadow: c.intensity > 0.5 ? "0 0 6px color-mix(in oklab, var(--glow) 40%, transparent)" : undefined,
              }}
              title={c.key}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {dates.map((d) => {
          const list = map.get(d)!;
          const done = list.filter((t) => t.status === "completed").length;
          return (
            <div key={d} className="glass rounded-2xl p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">{new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                <div className="text-[11px] text-muted-foreground">{done}/{list.length} done</div>
              </div>
              <div className="space-y-1.5">
                {list.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full`} style={{
                      background: t.status === "completed" ? "var(--primary)" : "color-mix(in oklab, var(--foreground) 20%, transparent)",
                      boxShadow: t.status === "completed" ? "0 0 8px var(--primary)" : undefined,
                    }} />
                    <span className={`min-w-0 flex-1 truncate ${t.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
                    <span className="text-muted-foreground">{to12Hour(t.time)}</span>
                    <button onClick={() => setEditing(t)} className="p-1 text-muted-foreground hover:text-[color:var(--primary)]" aria-label="Edit">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => { if (confirm("Delete this record?")) del(t.id); }} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {dates.length === 0 && (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No history yet.</div>
        )}
      </section>

      {editing && (
        <EditRecord
          task={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => { update(editing.id, patch); setEditing(null); }}
        />
      )}
    </AppShell>
  );
}

function EditRecord({ task, onClose, onSave }: { task: Task; onClose: () => void; onSave: (p: Partial<Task>) => void }) {
  const [title, setTitle] = useState(task.title);
  const [time, setTime] = useState(task.time);
  const [category, setCategory] = useState(task.category);
  const [status, setStatus] = useState(task.status);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="glass-strong relative w-full max-w-md animate-fade-up rounded-t-3xl p-5 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gradient">Edit Record</h2>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Time</div>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none" />
            </label>
            <label className="block">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Category</div>
              <input value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none" />
            </label>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
            <div className="flex gap-2">
              {(["pending", "in-progress", "completed", "skipped"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-semibold capitalize ${
                    status === s ? "text-primary-foreground glow-primary" : "glass text-muted-foreground"
                  }`}
                  style={status === s ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="glass flex-1 rounded-2xl py-3 text-sm font-semibold text-muted-foreground">Cancel</button>
          <button
            onClick={() => onSave({
              title, time, category, status,
              completion: status === "completed" ? 100 : task.completion,
            })}
            className="flex-[2] rounded-2xl py-3 text-sm font-semibold text-primary-foreground glow-primary"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
