import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useStudyStore, THEMES } from "@/lib/study-store";
import {
  Focus, Timer, History, CalendarCheck, StickyNote, Trophy, Shield, Palette,
  ChevronRight, KanbanSquare, CheckSquare, Search,
} from "lucide-react";

export const Route = createFileRoute("/more")({ component: More });

const links = [
  { to: "/focus", label: "Focus Mode", desc: "Immersive single-task view", icon: Focus },
  { to: "/pomodoro", label: "Pomodoro", desc: "25 · 50 · 90 · Custom", icon: Timer },
  { to: "/pending", label: "Pending Board", desc: "Kanban by priority", icon: KanbanSquare },
  { to: "/completed", label: "Completed", desc: "All finished tasks", icon: CheckSquare },
  { to: "/history", label: "History", desc: "Timeline & heatmap", icon: History },
  { to: "/attendance", label: "Attendance", desc: "Daily present / absent", icon: CalendarCheck },
  { to: "/notes", label: "Notes", desc: "Markdown notes", icon: StickyNote },
  { to: "/achievements", label: "Achievements", desc: "Badges & streaks", icon: Trophy },
  { to: "/search", label: "Search", desc: "Instant find anything", icon: Search },
  { to: "/admin", label: "Admin", desc: "Protected controls", icon: Shield },
] as const;

function More() {
  const theme = useStudyStore((s) => s.theme);
  const setTheme = useStudyStore((s) => s.setTheme);

  return (
    <AppShell>
      <header className="mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Menu</div>
        <h1 className="text-3xl font-bold text-gradient">More</h1>
      </header>

      {/* Theme picker */}
      <section className="glass-strong mb-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <div className="text-sm font-semibold">Theme</div>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                theme === t.id ? "glow-primary text-primary-foreground" : "glass text-muted-foreground"
              }`}
              style={theme === t.id ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}
            >
              <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                style={{ background: t.swatch, boxShadow: `0 0 8px ${t.swatch}` }} />
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        {links.map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to} className="glass flex items-center gap-3 rounded-2xl p-3 active:scale-[0.99]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 22%, var(--card)), var(--card))" }}>
              <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{label}</div>
              <div className="truncate text-[11px] text-muted-foreground">{desc}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
