import { Link } from "@tanstack/react-router";
import { Home, ListChecks, Map, History as HistoryIcon, NotebookPen, Menu } from "lucide-react";

const items: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/plan", label: "Plan", icon: ListChecks },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/history", label: "History", icon: HistoryIcon },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/more", label: "More", icon: Menu },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom px-3 pt-2">
      <div className="glass-strong mx-auto flex max-w-md items-center justify-around rounded-3xl px-2 py-1.5 glow-primary">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to as never}
            activeOptions={{ exact: !!exact }}
            className="group relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition-all active:scale-95 data-[status=active]:text-foreground"
          >
            <span className="pointer-events-none absolute inset-1 rounded-xl opacity-0 transition-opacity group-data-[status=active]:opacity-100"
              style={{
                background: "linear-gradient(180deg, color-mix(in oklab, var(--primary) 22%, transparent), transparent)",
                boxShadow: "0 0 24px -4px color-mix(in oklab, var(--glow) 45%, transparent)",
              }}
            />
            <Icon className="relative h-5 w-5" strokeWidth={2.25} />
            <span className="relative">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
