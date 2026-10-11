import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail } from "@/lib/notes-api";
import { Lock, Phone, Sparkles } from "lucide-react";

export function NotesLogin({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6,15}$/.test(phone.trim())) {
      setError("Enter a valid phone number");
      return;
    }
    if (!password) {
      setError("Enter your secret password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password,
    });
    setLoading(false);
    if (error) {
      setError("Invalid phone or password");
      return;
    }
    onSuccess();
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="glass-strong glow-primary relative w-full max-w-sm overflow-hidden rounded-3xl p-6 animate-fade-up">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-3xl opacity-60 blur-2xl"
          style={{
            background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 30%, transparent), color-mix(in oklab, var(--accent) 30%, transparent))",
          }}
        />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
            Study Journal
          </div>
          <h1 className="text-2xl font-bold text-gradient">Unlock your Notes</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            A private space for your daily study journal.
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            <label className="glass flex items-center gap-2 rounded-2xl px-3 py-2.5">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <input
                inputMode="numeric"
                autoComplete="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <label className="glass flex items-center gap-2 rounded-2xl px-3 py-2.5">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Secret Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </label>

            {error && (
              <div className="animate-fade-up rounded-2xl border px-3 py-2 text-xs"
                style={{ borderColor: "color-mix(in oklab, var(--destructive) 45%, transparent)", color: "var(--destructive)" }}>
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="mt-1 w-full rounded-2xl py-3 text-sm font-semibold text-primary-foreground glow-primary disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
            >
              {loading ? "Unlocking…" : "Enter Notes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
