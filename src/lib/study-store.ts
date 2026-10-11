import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId =
  | "royal-gold"
  | "royal-blue"
  | "emerald"
  | "ember"
  | "purple-neon"
  | "cyber-cyan"
  | "ruby"
  | "arctic"
  | "midnight"
  | "obsidian";

export const THEMES: { id: ThemeId; name: string; swatch: string }[] = [
  { id: "royal-gold", name: "Royal Gold", swatch: "#e8b84a" },
  { id: "royal-blue", name: "Royal Blue", swatch: "#4f78e8" },
  { id: "emerald", name: "Emerald Green", swatch: "#2dd4a8" },
  { id: "ember", name: "Volcanic Ember", swatch: "#f97046" },
  { id: "purple-neon", name: "Purple Neon", swatch: "#b06bff" },
  { id: "cyber-cyan", name: "Cyber Cyan", swatch: "#22d3ee" },
  { id: "ruby", name: "Ruby Red", swatch: "#ef4444" },
  { id: "arctic", name: "Arctic Ice", swatch: "#cfe8ff" },
  { id: "midnight", name: "Midnight Black", swatch: "#1a1a2a" },
  { id: "obsidian", name: "Obsidian Grey", swatch: "#4a4a55" },
];

export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in-progress" | "completed" | "skipped";
export type Attendance = "present" | "absent" | "late" | "partial" | null;

export interface Task {
  id: string;
  title: string;
  category: string;
  time: string;             // e.g. "09:00"
  priority: Priority;
  estimatedMin: number;
  actualMin: number;
  status: TaskStatus;
  attendance: Attendance;
  completion: number;       // 0-100
  notes: string;
  date: string;             // YYYY-MM-DD
  createdAt: number;
}

export interface RoadmapTopic {
  id: string;
  section: string;
  name: string;
  priority: Priority;
  status: "not-started" | "learning" | "revising" | "mastered";
  difficulty: "easy" | "medium" | "hard";
  estimatedHours: number;
  actualHours: number;
  completion: number;
  notes: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  tags: string[];
  updatedAt: number;
}

interface StudyState {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;

  tasks: Task[];
  addTask: (t: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;

  topics: RoadmapTopic[];
  updateTopic: (id: string, patch: Partial<RoadmapTopic>) => void;

  notes: Note[];
  addNote: (n: Omit<Note, "id" | "updatedAt">) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  streak: number;
  lastCompletedDate: string | null;
  bumpStreakIfNeeded: () => void;

  admin: { authed: boolean; login: (phone: string, pw: string) => boolean; logout: () => void };
}

const today = () => new Date().toISOString().slice(0, 10);

const SEED_ROADMAP: Omit<RoadmapTopic, "id">[] = (() => {
  const sections: Record<string, string[]> = {
    Frontend: ["HTML", "CSS", "Tailwind CSS", "JavaScript", "TypeScript", "React", "Next.js"],
    Backend: ["Node.js", "Express", "REST APIs", "Authentication", "MongoDB", "PostgreSQL", "Supabase"],
    "DevOps & Tools": ["Git", "GitHub", "Linux", "Docker", "AWS Basics"],
    "CS Core": ["C++", "OOP", "DBMS", "Operating Systems", "Computer Networks", "SQL"],
    DSA: [
      "Arrays", "Strings", "Linked List", "Stack", "Queue", "Trees", "BST",
      "Heap", "Graph", "Trie", "Recursion", "Backtracking", "Greedy",
      "Binary Search", "Sliding Window", "DP", "Segment Tree",
    ],
    "Interview Prep": ["Projects", "System Design Basics", "Interview Preparation"],
  };
  const out: Omit<RoadmapTopic, "id">[] = [];
  for (const [section, list] of Object.entries(sections)) {
    for (const name of list) {
      out.push({
        section,
        name,
        priority: "medium",
        status: "not-started",
        difficulty: "medium",
        estimatedHours: 6,
        actualHours: 0,
        completion: 0,
        notes: "",
      });
    }
  }
  return out;
})();

const SEED_TASKS: Omit<Task, "id" | "createdAt">[] = [
  { title: "DSA: Binary Search patterns", category: "DSA", time: "07:00", priority: "critical", estimatedMin: 90, actualMin: 0, status: "pending", attendance: null, completion: 0, notes: "", date: today() },
  { title: "React: Advanced hooks deep-dive", category: "Frontend", time: "09:30", priority: "high", estimatedMin: 75, actualMin: 0, status: "pending", attendance: null, completion: 0, notes: "", date: today() },
  { title: "System Design: Rate Limiters", category: "System Design", time: "14:00", priority: "high", estimatedMin: 60, actualMin: 0, status: "pending", attendance: null, completion: 0, notes: "", date: today() },
  { title: "Revision: Sliding Window", category: "Revision", time: "18:00", priority: "medium", estimatedMin: 45, actualMin: 0, status: "pending", attendance: null, completion: 0, notes: "", date: today() },
];

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      theme: "royal-gold",
      setTheme: (t) => set({ theme: t }),

      tasks: SEED_TASKS.map((t) => ({ ...t, id: uid(), createdAt: Date.now() })),
      addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), createdAt: Date.now() }] })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleComplete: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            if (t.status === "completed") {
              return { ...t, status: "pending", completion: 0 };
            }
            // Attendance is mandatory before completion.
            if (!t.attendance) {
              if (typeof window !== "undefined") {
                // Non-blocking hint; UI should show a modal, but this is the safety net.
                console.warn("[study-os] Mark attendance before completing:", t.title);
              }
              return t;
            }
            return { ...t, status: "completed", completion: 100 };
          }),
        })),

      topics: SEED_ROADMAP.map((t) => ({ ...t, id: uid() })),
      updateTopic: (id, patch) =>
        set((s) => ({ topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      notes: [
        {
          id: uid(),
          title: "Interview Focus",
          body: "Master DSA patterns, System Design basics, and 3 solid projects.",
          pinned: true,
          tags: ["goals"],
          updatedAt: Date.now(),
        },
      ],
      addNote: (n) => set((s) => ({ notes: [{ ...n, id: uid(), updatedAt: Date.now() }, ...s.notes] })),
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      streak: 0,
      lastCompletedDate: null,
      bumpStreakIfNeeded: () => {
        const s = get();
        const t = today();
        const todays = s.tasks.filter((x) => x.date === t);
        if (todays.length === 0) return;
        const allDone = todays.every((x) => x.status === "completed");
        if (allDone && s.lastCompletedDate !== t) {
          set({ streak: s.streak + 1, lastCompletedDate: t });
        }
      },

      admin: {
        authed: false,
        login: (phone, pw) => {
          const ok = phone.trim() === "8639675436" && pw === "study 007";
          if (ok) set((s) => ({ admin: { ...s.admin, authed: true } }));
          return ok;
        },
        logout: () => set((s) => ({ admin: { ...s.admin, authed: false } })),
      },
    }),
    {
      name: "study-os-v1",
      partialize: (s) => ({
        theme: s.theme,
        tasks: s.tasks,
        topics: s.topics,
        notes: s.notes,
        streak: s.streak,
        lastCompletedDate: s.lastCompletedDate,
      }),
    },
  ),
);

export const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "The expert in anything was once a beginner.",
  "Small daily improvements compound into stunning results.",
  "Focus is a decision, not a feeling.",
  "You don't have to be great to start. You have to start to be great.",
  "Your future is created by what you do today, not tomorrow.",
];
