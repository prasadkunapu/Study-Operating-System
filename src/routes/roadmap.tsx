import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/lib/study-store";
import { ChevronDown, CheckCircle2, Circle, BookOpen } from "lucide-react";

export const Route = createFileRoute("/roadmap")({ component: Roadmap });

function Roadmap() {
  const topics = useStudyStore((s) => s.topics);
  const update = useStudyStore((s) => s.updateTopic);
  const [openSection, setOpenSection] = useState<string | null>("DSA");

  const grouped = useMemo(() => {
    const map: Record<string, typeof topics> = {};
    for (const t of topics) (map[t.section] ||= []).push(t);
    return map;
  }, [topics]);

  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Master Roadmap</div>
        <h1 className="text-3xl font-bold text-gradient">Learning Path</h1>
      </header>

      <div className="space-y-3">
        {Object.entries(grouped).map(([section, list]) => {
          const done = list.filter((t) => t.status === "mastered").length;
          const isOpen = openSection === section;
          return (
            <div key={section} className="glass rounded-2xl">
              <button
                onClick={() => setOpenSection(isOpen ? null : section)}
                className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl glow-primary"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{section}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{done}/{list.length} mastered</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{
                        width: `${(done / list.length) * 100}%`,
                        background: "linear-gradient(90deg, var(--primary), var(--accent))",
                      }} />
                    </div>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t border-white/5 p-2">
                  {list.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        const next = t.status === "mastered" ? "not-started" : "mastered";
                        update(t.id, { status: next, completion: next === "mastered" ? 100 : 0 });
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/5"
                    >
                      {t.status === "mastered" ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--primary)" }} />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-sm ${t.status === "mastered" ? "text-muted-foreground line-through" : "font-medium"}`}>
                          {t.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          {t.difficulty} · {t.estimatedHours}h
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
