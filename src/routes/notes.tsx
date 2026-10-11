import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { NotesLogin } from "@/components/notes/NotesLogin";
import { JournalEditor } from "@/components/notes/JournalEditor";
import { StudySheetPreview } from "@/components/notes/StudySheetPreview";
import { supabase } from "@/integrations/supabase/client";
import {
  listJournals,
  listSheets,
  deleteJournal,
  deleteSheet,
  upsertJournal,
  updateSheet,
  signedSheetUrl,
  computeDayNumber,
  type StudyJournal,
  type StudySheet,
} from "@/lib/notes-api";
import type { Session } from "@supabase/supabase-js";
import {
  BookOpen, Pin, Star, Trash2, FileImage, Edit3, LogOut,
  Search, Sparkles, Clock, Download, FileText, Bell, CalendarDays, Copy, Archive,
} from "lucide-react";
import { formatClock } from "@/lib/time-format";
const format12 = formatClock;

export const Route = createFileRoute("/notes")({ component: NotesPage });

function NotesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <AppShell><div className="py-20 text-center text-sm text-muted-foreground">Loading…</div></AppShell>;
  if (!session) {
    return (
      <AppShell>
        <NotesLogin onSuccess={() => { /* auth listener updates state */ }} />
      </AppShell>
    );
  }
  return <NotesAuthed onSignOut={() => supabase.auth.signOut()} />;
}

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function NotesAuthed({ onSignOut }: { onSignOut: () => void }) {
  const [journals, setJournals] = useState<StudyJournal[]>([]);
  const [sheets, setSheets] = useState<StudySheet[]>([]);
  const [editing, setEditing] = useState<StudyJournal | null>(null);
  const [previewFor, setPreviewFor] = useState<StudyJournal | null>(null);
  const [q, setQ] = useState("");
  const [flowers, setFlowers] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const now = useLiveClock();
  const today = now.toISOString().slice(0, 10);

  const refresh = useCallback(async () => {
    const [j, s] = await Promise.all([listJournals(), listSheets()]);
    setJournals(j); setSheets(s);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const ch = supabase
      .channel("notes-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_journals" }, () => { void refresh(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "study_sheets" }, () => { void refresh(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  const hasToday = journals.some((j) => j.entry_date === today);
  const projectedDay = computeDayNumber(today, journals.map((j) => j.entry_date));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = journals.filter((j) => !j.archived);
    if (needle) {
      arr = arr.filter((j) =>
        (j.subject + " " + j.achievement + " " + j.notes + " " + j.topics_html).toLowerCase().includes(needle),
      );
    }
    return arr.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [journals, q]);

  const latestJournal = journals[0] ?? null;

  function handleSaved(j: StudyJournal) {
    setEditing(null);
    setFormKey((k) => k + 1); // reset form
    setToast("Study Journal Saved Successfully");
    setFlowers(true);
    setTimeout(() => setFlowers(false), 4200);
    setTimeout(() => setToast(null), 3200);
    setPreviewFor(j); // auto-open sheet generator preview
    void refresh();
  }

  async function duplicateJournal(j: StudyJournal) {
    const newDate = today;
    const dNum = computeDayNumber(newDate, journals.map((x) => x.entry_date));
    await upsertJournal({
      entry_date: newDate,
      day_name: new Date(newDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" }),
      day_number: dNum,
      subject: j.subject,
      topics_html: j.topics_html,
      study_hours: j.study_hours,
      achievement: j.achievement,
      notes: j.notes,
      pinned: false,
      favorite: false,
      archived: false,
    });
  }

  return (
    <AppShell>
      {/* Flowers */}
      {flowers && <FlowerBurst />}

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-6 z-[80] -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground glow-primary animate-fade-up"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
          ✨ {toast}
        </div>
      )}

      {/* Header */}
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Private Workspace</div>
          <h1 className="text-3xl font-bold text-gradient">Study Journal</h1>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="glass rounded-full px-2.5 py-1">
              <CalendarDays className="mr-1 inline h-3 w-3" />
              {now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="glass rounded-full px-2.5 py-1">{now.toLocaleDateString(undefined, { weekday: "long" })}</span>
            <span className="glass rounded-full px-2.5 py-1">
              <Clock className="mr-1 inline h-3 w-3" />{format12(now)}
            </span>
            <span className="glass rounded-full px-2.5 py-1 font-semibold" style={{ color: "var(--primary)" }}>
              Day {projectedDay}
            </span>
          </div>
        </div>
        <button onClick={onSignOut} className="glass shrink-0 rounded-full p-2 text-muted-foreground" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Reminder */}
      {!hasToday && !editing && (
        <div className="glass mb-3 flex items-center gap-2 rounded-2xl px-3 py-2.5 animate-fade-up">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full glow-primary"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            <Bell className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 text-xs">
            <div className="font-semibold">Write today's study journal</div>
            <div className="text-muted-foreground">Log your wins before the day slips away.</div>
          </div>
        </div>
      )}

      {/* 2. Study Journal Form */}
      <section className="glass-strong rounded-3xl p-4 mb-4 animate-fade-up">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {editing ? "Editing Entry" : "New Entry"}
            </div>
            <h2 className="text-lg font-semibold text-gradient">
              {editing ? `Day ${editing.day_number} · ${editing.subject}` : "Today's Journal"}
            </h2>
          </div>
          {editing && (
            <button onClick={() => { setEditing(null); setFormKey((k) => k + 1); }}
              className="glass rounded-full px-3 py-1 text-[11px] font-medium">
              New Entry
            </button>
          )}
        </div>
        <JournalEditor
          key={editing?.id ?? `new-${formKey}`}
          existing={editing}
          allDates={journals.map((j) => j.entry_date)}
          onSaved={handleSaved}
        />

        {/* 4. Generate Study Sheet */}
        {latestJournal && (
          <button
            onClick={() => setPreviewFor(latestJournal)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground glow-primary transition hover:scale-[1.01] active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--primary))" }}
          >
            <FileText className="h-4 w-4" /> 📄 Generate Study Sheet
            <span className="ml-1 text-[10px] font-normal opacity-80">· Day {latestJournal.day_number}</span>
          </button>
        )}
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatChip icon={<Sparkles className="h-3.5 w-3.5" />} label="Entries" value={String(journals.length)} />
        <StatChip icon={<Clock className="h-3.5 w-3.5" />} label="Hours"
          value={journals.reduce((s, j) => s + Number(j.study_hours || 0), 0).toFixed(1)} />
        <StatChip icon={<FileImage className="h-3.5 w-3.5" />} label="Sheets" value={String(sheets.length)} />
      </div>

      {/* 5. Study Sheet Gallery */}
      <section className="mt-5">
        <SectionTitle icon={<FileImage className="h-4 w-4" />} title="Study Sheet Gallery" count={sheets.length} />
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sheets.map((s) => (
            <SheetCard key={s.id} s={s}
              onDelete={async () => { if (confirm("Delete this study sheet?")) await deleteSheet(s); }}
              onFav={() => updateSheet(s.id, { favorite: !s.favorite })}
            />
          ))}
          {sheets.length === 0 && (
            <div className="glass col-span-full rounded-2xl p-6 text-center text-xs text-muted-foreground">
              Your generated sheets will appear here.
            </div>
          )}
        </div>
      </section>

      {/* 6. Journal History */}
      <section className="mt-6 pb-24">
        <SectionTitle icon={<BookOpen className="h-4 w-4" />} title="Journal History" count={journals.length} />
        <div className="glass mt-2 mb-2 flex items-center gap-2 rounded-2xl px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject, topics, wins…"
            className="flex-1 bg-transparent text-sm outline-none" />
        </div>

        <div className="space-y-2">
          {filtered.map((j) => (
            <JournalCard key={j.id} j={j}
              onEdit={() => {
                setEditing(j);
                requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
              }}
              onPreview={() => setPreviewFor(j)}
              onDuplicate={() => duplicateJournal(j)}
              onArchive={() => upsertJournal({ ...j, archived: !j.archived })}
              onDelete={async () => { if (confirm("Delete this journal?")) await deleteJournal(j.id); }}
              onPin={async () => { await upsertJournal({ ...j, pinned: !j.pinned }); }}
              onFav={async () => { await upsertJournal({ ...j, favorite: !j.favorite }); }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No journals yet. Save your first entry above.
            </div>
          )}
        </div>
      </section>

      {previewFor && <StudySheetPreview journal={previewFor} onClose={() => setPreviewFor(null)} />}
    </AppShell>
  );
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--primary)" }}>{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {typeof count === "number" && (
        <span className="glass rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span style={{ color: "var(--primary)" }}>{icon}</span>{label}
      </div>
      <div className="text-lg font-bold text-gradient">{value}</div>
    </div>
  );
}

function JournalCard({
  j, onEdit, onDelete, onPin, onFav, onPreview, onDuplicate, onArchive,
}: {
  j: StudyJournal;
  onEdit: () => void; onDelete: () => void;
  onPin: () => void; onFav: () => void; onPreview: () => void;
  onDuplicate: () => void; onArchive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dateLabel = new Date(j.entry_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const createdLabel = format12(new Date(j.created_at));
  return (
    <div className="glass rounded-2xl p-3 animate-fade-up">
      <button onClick={() => setOpen((o) => !o)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-2 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-semibold" style={{ color: "var(--primary)" }}>Day {j.day_number}</span>
            <span>·</span><span>{j.day_name}</span><span>·</span><span>{dateLabel}</span>
            <span>·</span><span>{createdLabel}</span>
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold">{j.subject}</div>
          <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
            {j.study_hours} hrs · {j.achievement}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {j.pinned && <Pin className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />}
          {j.favorite && <Star className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />}
          {j.archived && <Archive className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3 animate-fade-up">
          <div className="prose prose-invert prose-sm max-w-none text-[13px]"
            dangerouslySetInnerHTML={{ __html: j.topics_html }} />
          {j.notes && (
            <div className="rounded-xl bg-white/5 p-2.5 text-[12px] text-muted-foreground whitespace-pre-wrap">{j.notes}</div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <IconAction onClick={onPreview}><FileImage className="h-3.5 w-3.5" /> Sheet</IconAction>
            <IconAction onClick={onEdit}><Edit3 className="h-3.5 w-3.5" /> Edit</IconAction>
            <IconAction onClick={onDuplicate}><Copy className="h-3.5 w-3.5" /> Duplicate</IconAction>
            <IconAction onClick={onPin} active={j.pinned}><Pin className="h-3.5 w-3.5" /> {j.pinned ? "Unpin" : "Pin"}</IconAction>
            <IconAction onClick={onFav} active={j.favorite}><Star className="h-3.5 w-3.5" /> {j.favorite ? "Unfav" : "Fav"}</IconAction>
            <IconAction onClick={onArchive} active={j.archived}><Archive className="h-3.5 w-3.5" /> {j.archived ? "Restore" : "Archive"}</IconAction>
            <IconAction onClick={onDelete} danger><Trash2 className="h-3.5 w-3.5" /> Delete</IconAction>
          </div>
        </div>
      )}
    </div>
  );
}

function IconAction({ children, onClick, active, danger }: { children: React.ReactNode; onClick: () => void; active?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
        danger ? "text-destructive hover:bg-destructive/10" : active ? "text-[color:var(--primary)]" : "text-muted-foreground"
      }`}>
      {children}
    </button>
  );
}

function SheetCard({
  s, onDelete, onFav,
}: {
  s: StudySheet; onDelete: () => void; onFav: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    let alive = true;
    void signedSheetUrl(s.png_path).then((u) => { if (alive) setUrl(u); });
    if (s.pdf_path) void signedSheetUrl(s.pdf_path).then((u) => { if (alive) setPdfUrl(u); });
    return () => { alive = false; };
  }, [s.png_path, s.pdf_path]);

  return (
    <>
      <div className="glass overflow-hidden rounded-2xl animate-fade-up">
        <button onClick={() => setZoom(true)} className="relative block aspect-[794/1123] w-full bg-white/5">
          {url && <img src={url} alt={s.title} className="h-full w-full object-cover" />}
          <span onClick={(e) => { e.stopPropagation(); onFav(); }}
            className={`absolute right-1.5 top-1.5 rounded-full p-1.5 ${s.favorite ? "text-[color:var(--accent)]" : "text-white/80"}`}
            style={{ background: "rgba(0,0,0,.45)" }}>
            <Star className="h-3.5 w-3.5" />
          </span>
        </button>
        <div className="p-2">
          <div className="truncate text-[11px] font-semibold">{s.title}</div>
          <div className="text-[10px] text-muted-foreground">{s.entry_date} · {s.study_hours}h</div>
          <div className="mt-1.5 flex items-center gap-1">
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer"
                className="glass flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium">
                <Download className="h-3 w-3" /> PDF
              </a>
            )}
            <button onClick={onDelete} className="glass rounded-full p-1.5 text-muted-foreground">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {zoom && url && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95" onClick={() => setZoom(false)}>
          <div className="flex items-center justify-between px-3 py-2 text-white">
            <div className="truncate text-sm font-semibold">{s.title}</div>
            <div className="flex gap-1">
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                  className="glass rounded-full px-3 py-1 text-xs">PDF</a>
              )}
              <a href={url} download onClick={(e) => e.stopPropagation()}
                className="glass rounded-full px-3 py-1 text-xs">PNG</a>
              <button className="glass rounded-full px-3 py-1 text-xs">Close</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <img src={url} alt={s.title} className="mx-auto max-w-full" style={{ boxShadow: "0 20px 80px rgba(0,0,0,.6)" }} />
          </div>
        </div>
      )}
    </>
  );
}

/** Flower falling burst — pure CSS particles */
function FlowerBurst() {
  const flowers = ["🌸", "🌺", "🌼", "💮", "🌷", "❁"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {Array.from({ length: 32 }).map((_, i) => (
        <span key={i}
          className="absolute text-xl"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `-10%`,
            animation: `flower-fall ${3 + (i % 5) * 0.4}s ease-in ${i * 0.08}s forwards`,
            filter: "drop-shadow(0 2px 8px rgba(255,255,255,.25))",
          }}>
          {flowers[i % flowers.length]}
        </span>
      ))}
      <style>{`
        @keyframes flower-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
