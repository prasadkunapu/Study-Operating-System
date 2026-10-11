import { createFileRoute } from "@tanstack/react-router";
import { to12Hour } from "@/lib/time-format";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useStudyStore } from "@/lib/study-store";
import { Shield, LogOut, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const authed = useStudyStore((s) => s.admin.authed);
  const login = useStudyStore((s) => s.admin.login);
  const logout = useStudyStore((s) => s.admin.logout);
  const tasks = useStudyStore((s) => s.tasks);
  const del = useStudyStore((s) => s.deleteTask);

  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  if (!authed) {
    return (
      <AppShell>
        <div className="mx-auto mt-6 max-w-sm">
          <div className="glass-strong glow-primary rounded-3xl p-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl glow-primary"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-center text-xl font-bold text-gradient">Admin Access</h1>
            <p className="mt-1 text-center text-xs text-muted-foreground">Restricted area. Sign in to continue.</p>
            <div className="mt-4 space-y-3">
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                inputMode="tel" placeholder="Phone number"
                className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]" />
              <input value={pw} onChange={(e) => setPw(e.target.value)}
                type="password" placeholder="Secret password"
                className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--primary)]" />
              {err && <div className="text-center text-xs text-destructive">{err}</div>}
              <button
                onClick={() => {
                  const ok = login(phone, pw);
                  if (!ok) setErr("Invalid credentials"); else setErr("");
                }}
                className="w-full rounded-2xl py-3 text-sm font-semibold text-primary-foreground glow-primary"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                Enter
              </button>
              <p className="text-center text-[10px] text-muted-foreground/70">
                Local-only auth. For real security, enable Lovable Cloud.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Control Panel</div>
          <h1 className="text-3xl font-bold text-gradient">Admin</h1>
        </div>
        <button onClick={logout} className="glass flex items-center gap-1.5 rounded-full px-3 py-2 text-xs">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>

      <div className="glass mb-3 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">All Tasks</div>
        <div className="mt-1 text-2xl font-bold text-gradient">{tasks.length}</div>
      </div>

      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="glass flex items-center gap-3 rounded-2xl p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{t.title}</div>
              <div className="text-[11px] text-muted-foreground">{t.category} · {t.date} · {to12Hour(t.time)} · {t.status}</div>
            </div>
            <button onClick={() => del(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
