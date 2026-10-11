import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { StudySheetTemplate } from "./StudySheetTemplate";
import { uploadSheetFiles, createSheetRow, type StudyJournal } from "@/lib/notes-api";
import { Download, Printer, X, ZoomIn, ZoomOut, RefreshCw, Save } from "lucide-react";

export function StudySheetPreview({
  journal,
  onClose,
}: {
  journal: StudyJournal;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [pngBlob, setPngBlob] = useState<Blob | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [zoom, setZoom] = useState(0.5);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [genState, setGenState] = useState<"idle" | "working" | "done" | "error">("idle");

  async function generate() {
    if (!ref.current) return;
    setGenState("working");
    setErr(null);
    try {
      // html-to-image bypasses html2canvas's OKLCH / color-mix parsing bugs.
      const { toPng, toBlob } = await import("html-to-image");
      const node = ref.current;
      const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        width: 794,
        height: Math.max(1123, node.scrollHeight),
        style: { transform: "none" },
      };

      const blob = await toBlob(node, options);
      if (!blob) throw new Error("Failed to render sheet image");
      setPngBlob(blob);
      setPngUrl(URL.createObjectURL(blob));

      const dataUrl = await toPng(node, options);
      const { default: jsPDF } = await import("jspdf");
      // Get pixel dims from dataUrl
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("image load")); });
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [img.width, img.height] });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      setPdfBlob(pdf.output("blob"));
      setGenState("done");
    } catch (e: any) {
      console.error("[study-sheet] generation failed", e);
      setErr(e?.message || "Failed to generate study sheet");
      setGenState("error");
    }
  }

  useEffect(() => {
    // Wait a frame so fonts / DOM settle before capture
    const id = requestAnimationFrame(() => { void generate(); });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-save once generated
    if (!pngBlob || !pdfBlob || savedId) return;
    (async () => {
      setSaving(true);
      setErr(null);
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Not signed in");
        const { pngPath, pdfPath } = await uploadSheetFiles({ userId: u.user.id, pngBlob, pdfBlob });
        const row = await createSheetRow({
          journal_id: journal.id,
          title: `${journal.subject} · Day ${journal.day_number}`,
          subject: journal.subject,
          entry_date: journal.entry_date,
          day_number: journal.day_number,
          study_hours: journal.study_hours,
          png_path: pngPath,
          pdf_path: pdfPath,
        });
        setSavedId(row.id);
      } catch (e: any) {
        setErr(e.message || "Failed to save study sheet");
      } finally {
        setSaving(false);
      }
    })();
  }, [pngBlob, pdfBlob, savedId, journal]);

  function download(blob: Blob | null, filename: string) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function printSheet() {
    if (!pngUrl) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<img src="${pngUrl}" style="width:100%" onload="setTimeout(()=>window.print(),300)"/>`);
    w.document.close();
  }

  const fname = `study-sheet-${journal.entry_date}-day${journal.day_number}`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur">
      {/* Off-screen source for capture */}
      <div style={{ position: "fixed", top: -10000, left: 0 }}>
        <StudySheetTemplate ref={ref} journal={journal} />
      </div>

      <header className="flex items-center justify-between gap-2 px-3 py-2 text-white">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-white/60">Study Sheet</div>
          <div className="truncate text-sm font-semibold">{journal.subject} · Day {journal.day_number}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}><ZoomOut className="h-4 w-4" /></IconBtn>
          <IconBtn onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}><ZoomIn className="h-4 w-4" /></IconBtn>
          <IconBtn onClick={() => { setPngUrl(null); setPngBlob(null); setPdfBlob(null); setSavedId(null); void generate(); }}>
            <RefreshCw className="h-4 w-4" />
          </IconBtn>
          <IconBtn onClick={onClose}><X className="h-4 w-4" /></IconBtn>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto" style={{ width: 794 * zoom }}>
          {pngUrl ? (
            <img src={pngUrl} style={{ width: "100%", boxShadow: "0 20px 80px rgba(0,0,0,.6)" }} alt="Study sheet preview" />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-white/70">
              {genState === "error" ? (
                <>
                  <div className="text-red-300">{err || "Generation failed"}</div>
                  <button onClick={() => void generate()} className="glass rounded-full px-4 py-1.5 text-xs font-medium">
                    Try again
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Generating…
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="glass-strong flex flex-wrap items-center justify-center gap-2 border-t border-white/10 p-3">
        {err && genState !== "error" && <span className="text-xs text-red-300">{err}</span>}
        {saving && <span className="text-xs text-white/70 flex items-center gap-1"><Save className="h-3.5 w-3.5" /> Saving…</span>}
        {savedId && <span className="text-xs text-emerald-300">Saved to Gallery</span>}
        <button onClick={() => download(pngBlob, `${fname}.png`)} disabled={!pngBlob}
          className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50">
          <Download className="h-3.5 w-3.5" /> PNG
        </button>
        <button onClick={() => download(pdfBlob, `${fname}.pdf`)} disabled={!pdfBlob}
          className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50">
          <Download className="h-3.5 w-3.5" /> PDF
        </button>
        <button onClick={printSheet} disabled={!pngUrl}
          className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50">
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
      </footer>
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass rounded-full p-2 text-white/90 hover:bg-white/10">{children}</button>
  );
}
