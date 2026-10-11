import { forwardRef } from "react";
import type { StudyJournal } from "@/lib/notes-api";

// A4 at 96dpi = 794 x 1123 px. Rendered off-screen, black on white, print-friendly.
export const StudySheetTemplate = forwardRef<HTMLDivElement, { journal: StudyJournal }>(
  function StudySheetTemplate({ journal }, ref) {
    const generatedAt = new Date();
    const d = new Date(journal.entry_date + "T00:00:00");
    return (
      <div
        ref={ref}
        style={{
          width: 794,
          minHeight: 1123,
          padding: 56,
          background: "#ffffff",
          color: "#111",
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          lineHeight: 1.5,
        }}
      >
        <header style={{ borderBottom: "2px solid #111", paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#555" }}>Study OS</div>
              <h1 style={{ margin: "4px 0 0", fontSize: 30, fontWeight: 800 }}>Study Journal</h1>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "#333" }}>
              <div><strong>Day {journal.day_number}</strong></div>
              <div>{d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
              <div>{generatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}</div>
            </div>
          </div>
        </header>

        <section style={{ marginBottom: 20 }}>
          <FieldRow label="Subject" value={journal.subject} />
          <FieldRow label="Study Hours" value={`${journal.study_hours} hrs`} />
          <FieldRow label="Biggest Achievement" value={journal.achievement} />
        </section>

        <section style={{ marginBottom: 20 }}>
          <SectionTitle>Today's Completed Topics</SectionTitle>
          <div
            style={{ fontSize: 13, color: "#111" }}
            dangerouslySetInnerHTML={{ __html: journal.topics_html || "<p><em>—</em></p>" }}
          />
        </section>

        {journal.notes && (
          <section style={{ marginBottom: 20 }}>
            <SectionTitle>Journal Notes</SectionTitle>
            <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{journal.notes}</p>
          </section>
        )}

        <footer style={{ position: "relative", marginTop: 40, borderTop: "1px solid #ddd", paddingTop: 16, fontSize: 11, color: "#666" }}>
          <div style={{ fontStyle: "italic", fontSize: 12, color: "#333" }}>"Consistency Beats Intensity."</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span>Study OS · Personal Study Operating System</span>
            <span>Generated {generatedAt.toLocaleString([], { hour12: true })}</span>
          </div>
        </footer>
      </div>
    );
  }
);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", padding: "6px 0", borderBottom: "1px dashed #ddd" }}>
      <div style={{ width: 180, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#666" }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
