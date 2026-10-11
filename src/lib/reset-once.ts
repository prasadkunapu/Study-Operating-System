// One-time client reset flag. Bumping the version wipes local testing data
// (planner, streaks, music preferences) so the app looks brand-new.
const FLAG = "studyos-reset-v1";
const KEYS = ["study-store", "study-music-v2"];

export function runOneTimeReset() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(FLAG)) return;
    for (const k of KEYS) localStorage.removeItem(k);
    localStorage.setItem(FLAG, new Date().toISOString());
  } catch {
    /* ignore */
  }
}
