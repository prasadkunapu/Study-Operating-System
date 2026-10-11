# Study-Operating-System

**Study OS – Premium Personal Study Operating System**

A personal study operating system built for focused, long-horizon preparation. It combines daily planning, attendance, a two-year roadmap, analytics, focus tools, a cloud music hub, and a premium study journal with printable A4 study sheets.

## Features

- **Home** – today's plan, streak, session time, attendance and roadmap progress at a glance
- **Daily Plan** – create, edit, save, cancel and delete tasks; completion drives attendance
- **Roadmap** – a fixed 2-year, month-by-month path with per-milestone progress
- **History** – 90-day heatmap plus a timeline of completed work, with edit and delete
- **Attendance** – calculated automatically from daily plan completion
- **Focus & Pomodoro** – distraction-free timers and session logging
- **Music Hub** – upload tracks to cloud storage, keep a queue, shuffle, loop and favourites; playback persists across navigation and syncs across devices
- **Notes (Study Journal)** – authenticated rich-text journal, automatic A4 study sheet generation, PNG/PDF/Print export, and a sheet gallery
- **Themes** – a global theme engine with ten switchable palettes and an animated background

## Tech Stack

- [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7)
- Tailwind CSS v4
- Supabase (database, storage, realtime, auth) via Lovable Cloud
- Zustand for local state
- TipTap for the journal editor

## Getting Started

```bash
bun install
bun run dev
```

The app runs at `http://localhost:8080`.

## Environment

Copy the values from `.env.example` into a local `.env` file. The Supabase project URL and publishable key are required for the backend features (journal, music storage, realtime sync).

## Notes

The `notes` section is protected by its own sign-in and is intended for a single personal account.
