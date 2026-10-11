import { type ReactNode } from "react";
import { AnimatedBackground } from "./AnimatedBackground";
import { BottomNav } from "./BottomNav";
import { ThemeSync } from "./ThemeSync";
import { Celebration } from "./Celebration";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <ThemeSync />
      <AnimatedBackground />
      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6 sm:max-w-2xl safe-top">
        {children}
      </main>
      {/* Music player mounted once at root — see src/routes/__root.tsx */}
      <BottomNav />
      <Celebration />
    </div>
  );
}
