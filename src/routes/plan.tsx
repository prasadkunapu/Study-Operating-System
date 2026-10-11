import { createFileRoute } from "@tanstack/react-router";
import { to12Hour } from "@/lib/time-format";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useStudyStore, type Priority } from "@/lib/study-store";
import { Plus, Check, Trash2, Clock, X, Pencil } from "lucide-react";

export const Route = createFileRoute("/plan")({ component: Plan });

const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];

function Plan() {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = useStudyStore((s) => s.tasks);
  const toggle = useStudyStore((s) => s.toggleComplete);
  const del = useStudyStore((s) => s.deleteTask);
  const add = useStudyStore((s) => s.addTask);
  const update = useStudyStore((s) => s.updateTask);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", category: "DSA", time: "09:00", priority: "high" as Priority, estimatedMin: 60,
  });

  function openNew() {
    setEditingId(null);
    setForm({ title: "", category: "DSA", time: "09:00", priority: "high", estimatedMin: 60 });
    setOpen(true);
  }
  function openEdit(id: string) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setForm({ title: t.title, category: t.category, time: t.time, priority: t.priority, estimatedMin: t.estimatedMin });
    setOpen(true);
  }

  const todays = tasks.filter((t) => t.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const done = todays.filter((t) => t.status === "completed").length;

  return (
    <AppShell>
      <header className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Daily Plan</div>
          <h1 className="text-3xl font-bold text-gradient">Today</h1>
        </div>
        <div className="glass rounded-2xl px-3 py-2 text-right">
          <div className="text-lg font-bold tabular-nums">{done}/{todays.length}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Done</div>
        </div>
      </header>

      <div className="space-y-3">
        {todays.map((t) => (
          <div key={t.id} className="glass group rounded-2xl p-3 transition-transform active:scale-[0.99]">
            <div className="flex items-start gap-3">
              <button
                onClick={() => {
                  if (t.status !== "completed" && !t.attendance) {
                    // Attendance is required before a task can be completed.
                    return;
                  }
                  toggle(t.id);
                }}
                title={t.status !== "completed" && !t.attendance ? "Mark attendance below before completing" : undefined}
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                  t.status === "completed"
                    ? "border-transparent text-primary-foreground glow-primary"
                    : t.attendance
                      ? "border-white/20"
                      : "border-white/10 opacity-50"
                }`}
                style={t.status === "completed" ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}
              >
                {t.status === "completed" && <Check className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold ${t.status === "completed" ? "text-muted-foreground line-through" : ""}`}>
                  {t.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="glass rounded-full px-2 py-0.5"><Clock className="mr-1 inline h-3 w-3" />{to12Hour(t.time)}</span>
                  <span className="glass rounded-full px-2 py-0.5">{t.category}</span>
                  <span className="glass rounded-full px-2 py-0.5">{t.estimatedMin}m</span>
                  <PriorityBadge p={t.priority} />
                </div>
                <div className="mt-2 flex gap-1">
                  {(["present", "late", "partial", "absent"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => update(t.id, { attendance: a })}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize transition ${
                        t.attendance === a ? "text-primary-foreground" : "glass text-muted-foreground"
                      }`}
                      style={t.attendance === a ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(t.id)} className="p-1.5 text-muted-foreground hover:text-[color:var(--primary)]" aria-label="Edit task">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => { if (confirm("Delete this task?")) del(t.id); }} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Delete task">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Completion bar */}
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${t.completion}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--accent))",
                  boxShadow: "0 0 12px color-mix(in oklab, var(--glow) 60%, transparent)",
                }}
              />
            </div>
          </div>
        ))}
        {todays.length === 0 && (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No tasks yet. Tap the + to add your first mission.
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="glass-strong glow-primary fixed bottom-24 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className="glass-strong relative w-full max-w-md animate-fade-up rounded-t-3xl p-5 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gradient">{editingId ? "Edit Task" : "New Task"}</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Title">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]" placeholder="e.g. DSA: Trees traversal" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Time">
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none" />
                </Field>
                <Field label="Duration (min)">
                  <input type="number" value={form.estimatedMin} onChange={(e) => setForm({ ...form, estimatedMin: +e.target.value })}
                    className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none" />
                </Field>
              </div>
              <Field label="Category">
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none" />
              </Field>
              <Field label="Priority">
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button key={p} onClick={() => setForm({ ...form, priority: p })}
                      className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold capitalize ${
                        form.priority === p ? "text-primary-foreground glow-primary" : "glass text-muted-foreground"
                      }`}
                      style={form.priority === p ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}>
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="glass flex-1 rounded-2xl py-3 text-sm font-semibold text-muted-foreground">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!form.title.trim()) return;
                  if (editingId) {
                    update(editingId, {
                      title: form.title, category: form.category, time: form.time,
                      priority: form.priority, estimatedMin: form.estimatedMin,
                    });
                  } else {
                    add({
                      title: form.title, category: form.category, time: form.time,
                      priority: form.priority, estimatedMin: form.estimatedMin, actualMin: 0,
                      status: "pending", attendance: null, completion: 0, notes: "", date: today,
                    });
                  }
                  setOpen(false);
                }}
                className="flex-[2] rounded-2xl py-3 text-sm font-semibold text-primary-foreground glow-primary"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                {editingId ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
function PriorityBadge({ p }: { p: Priority }) {
  const map: Record<Priority, string> = {
    critical: "var(--destructive)", high: "var(--primary)", medium: "var(--accent)", low: "var(--muted-foreground)",
  };
  return (
    <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-0.5 capitalize">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: map[p], boxShadow: `0 0 8px ${map[p]}` }} />
      {p}
    </span>
  );
}
