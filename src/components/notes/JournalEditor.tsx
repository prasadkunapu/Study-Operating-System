import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Code, Save } from "lucide-react";
import { dayName, upsertJournal, type StudyJournal } from "@/lib/notes-api";

const SUBJECT_CHIPS = ["C++", "React", "DSA", "Operating Systems", "Computer Networks", "DBMS", "Projects", "Interview Prep"];

export function JournalEditor({
  existing,
  allDates: _allDates,
  onSaved,
}: {
  existing?: StudyJournal | null;
  allDates: string[];
  onSaved: (j: StudyJournal) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(existing?.entry_date ?? today);
  const [dayNumStr, setDayNumStr] = useState<string>(existing?.day_number ? String(existing.day_number) : "");
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [studyHours, setStudyHours] = useState<number>(existing?.study_hours ?? 0);
  const [achievement, setAchievement] = useState(existing?.achievement ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "What did you learn today? Use bold, lists, headings…" }),
    ],
    content: existing?.topics_html || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none min-h-[140px] px-3 py-2.5 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (existing && editor) editor.commands.setContent(existing.topics_html || "");
  }, [existing, editor]);

  const dName = dayName(date);

  async function handleSave() {
    setErr(null);
    if (!subject.trim()) { setErr("Subject is required"); return; }
    if (!editor?.getText().trim()) { setErr("Add today's completed topics"); return; }
    if (!(studyHours > 0)) { setErr("Enter study hours"); return; }
    if (!achievement.trim()) { setErr("Add today's biggest achievement"); return; }
    const dNum = parseInt(dayNumStr, 10);
    if (!Number.isFinite(dNum) || dNum < 1) { setErr("Enter a valid day number"); return; }
    setSaving(true);
    try {
      const saved = await upsertJournal({
        id: existing?.id,
        entry_date: date,
        day_name: dName,
        day_number: dNum,
        subject: subject.trim(),
        topics_html: editor.getHTML(),
        study_hours: Number(studyHours),
        achievement: achievement.trim(),
        notes: notes.trim(),
        pinned: existing?.pinned ?? false,
        favorite: existing?.favorite ?? false,
        archived: existing?.archived ?? false,
      });
      onSaved(saved);
    } catch (e: any) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="glass rounded-2xl px-3 py-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Date</div>
          <input type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)}
            className="mt-0.5 w-full bg-transparent text-sm outline-none" />
        </label>
        <label className="glass rounded-2xl px-3 py-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{dName} · Day #</div>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={dayNumStr}
            onChange={(e) => setDayNumStr(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 25"
            className="mt-0.5 w-full bg-transparent text-sm font-semibold outline-none text-gradient"
          />
        </label>
      </div>

      <div>
        <label className="glass block rounded-2xl px-3 py-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Subject</div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. React, DSA, DBMS"
            className="mt-0.5 w-full bg-transparent text-sm outline-none" />
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUBJECT_CHIPS.map((s) => (
            <button key={s} onClick={() => setSubject(s)}
              className="glass rounded-full px-2.5 py-1 text-[11px]">{s}</button>
          ))}
        </div>
      </div>


      <div className="glass rounded-2xl">
        <div className="flex items-center gap-1 border-b border-white/5 px-2 py-1.5">
          <TB onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")}><Bold className="h-3.5 w-3.5" /></TB>
          <TB onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")}><Italic className="h-3.5 w-3.5" /></TB>
          <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })}><Heading2 className="h-3.5 w-3.5" /></TB>
          <TB onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")}><List className="h-3.5 w-3.5" /></TB>
          <TB onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")}><ListOrdered className="h-3.5 w-3.5" /></TB>
          <TB onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive("codeBlock")}><Code className="h-3.5 w-3.5" /></TB>
          <div className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">Today's Topics</div>
        </div>
        <EditorContent editor={editor} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="glass rounded-2xl px-3 py-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Study Hours</div>
          <input type="number" min={0} step={0.25} value={studyHours}
            onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0)}
            className="mt-0.5 w-full bg-transparent text-sm outline-none" />
        </label>
        <label className="glass rounded-2xl px-3 py-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Biggest Win</div>
          <input value={achievement} onChange={(e) => setAchievement(e.target.value)}
            placeholder="Solved 12 LC problems"
            className="mt-0.5 w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      <label className="glass block rounded-2xl px-3 py-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Extra Notes</div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional reflections…"
          className="mt-0.5 w-full resize-none bg-transparent text-sm outline-none" />
      </label>

      {err && (
        <div className="rounded-2xl border px-3 py-2 text-xs animate-fade-up"
          style={{ borderColor: "color-mix(in oklab, var(--destructive) 45%, transparent)", color: "var(--destructive)" }}>
          {err}
        </div>
      )}

      <button disabled={saving} onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground glow-primary disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
        <Save className="h-4 w-4" /> {saving ? "Saving…" : existing ? "Update Journal" : "Save Journal"}
      </button>
    </div>
  );
}

function TB({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} type="button"
      className={`rounded-lg p-1.5 text-muted-foreground transition ${active ? "bg-white/10 text-foreground" : "hover:bg-white/5"}`}>
      {children}
    </button>
  );
}
