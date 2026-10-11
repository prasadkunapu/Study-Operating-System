import { createFileRoute } from "@tanstack/react-router";
import { to12Hour } from "@/lib/time-format";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/lib/study-store";
import { Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({ component: Search });

function Search() {
  const [q, setQ] = useState("");
  const tasks = useStudyStore((s) => s.tasks);
  const topics = useStudyStore((s) => s.topics);
  const notes = useStudyStore((s) => s.notes);
  const query = q.toLowerCase();

  const rTasks = query ? tasks.filter((t) => (t.title + " " + t.category).toLowerCase().includes(query)) : [];
  const rTopics = query ? topics.filter((t) => (t.name + " " + t.section).toLowerCase().includes(query)) : [];
  const rNotes = query ? notes.filter((n) => (n.title + " " + n.body).toLowerCase().includes(query)) : [];

  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Instant Search</div>
        <h1 className="text-3xl font-bold text-gradient">Search</h1>
      </header>
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Tasks, topics, notes…"
          className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      {q && (
        <div className="mt-4 space-y-3">
          <Section title={`Tasks (${rTasks.length})`}>
            {rTasks.map((t) => (
              <div key={t.id} className="glass rounded-xl p-3 text-sm">
                <div className="font-semibold">{t.title}</div>
                <div className="text-[11px] text-muted-foreground">{t.category} · {t.date} {to12Hour(t.time)}</div>
              </div>
            ))}
          </Section>
          <Section title={`Topics (${rTopics.length})`}>
            {rTopics.map((t) => (
              <div key={t.id} className="glass rounded-xl p-3 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-[11px] text-muted-foreground">{t.section} · {t.status}</div>
              </div>
            ))}
          </Section>
          <Section title={`Notes (${rNotes.length})`}>
            {rNotes.map((n) => (
              <div key={n.id} className="glass rounded-xl p-3 text-sm">
                <div className="font-semibold">{n.title}</div>
                <div className="line-clamp-2 text-[11px] text-muted-foreground">{n.body}</div>
              </div>
            ))}
          </Section>
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
