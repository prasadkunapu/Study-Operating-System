// 12-hour time formatting utilities.

/** "09:00" or "9:00" -> "9:00 AM"; "14:30" -> "2:30 PM". Returns input on parse failure. */
export function to12Hour(hhmm: string): string {
  if (!hhmm) return "";
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  let h = parseInt(m[1], 10);
  const min = m[2];
  if (isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${suffix}`;
}

/** Format a Date to "1:05 PM". */
export function formatClock(d: Date = new Date()): string {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suffix}`;
}

/** Format seconds to "m:ss" or "h:mm:ss". */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const totalMin = Math.floor(seconds / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s}`;
  return `${m}:${s}`;
}
