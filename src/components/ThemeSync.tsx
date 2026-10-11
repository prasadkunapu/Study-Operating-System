import { useEffect } from "react";
import { useStudyStore } from "@/lib/study-store";

export function ThemeSync() {
  const theme = useStudyStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--background");
    if (meta && bg) meta.setAttribute("content", `oklch(${bg.trim()})`);
  }, [theme]);
  return null;
}
