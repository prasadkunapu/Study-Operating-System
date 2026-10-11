import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RepeatMode = "off" | "all" | "one";

export interface CloudSong {
  id: string;
  name: string;
  storage_path: string;
  category: string;
  duration_seconds: number | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

interface MusicState {
  // Playback state persisted to localStorage
  currentSongId: string | null;
  position: number;              // seconds — restored on load
  volume: number;                // 0..1
  playbackRate: number;          // 0.5..2
  shuffle: boolean;
  repeat: RepeatMode;
  queue: string[];               // song ids in playback order
  originalQueue: string[];       // pre-shuffle order
  favorites: string[];
  recentlyPlayed: string[];      // most recent first
  activePlaylistId: string | null;
  activeCategory: string;        // "All" or a category name

  setCurrent: (id: string | null) => void;
  setPosition: (p: number) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (r: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setQueue: (ids: string[], originalOrder?: string[]) => void;
  playFrom: (ids: string[], startId: string) => void;
  addToQueue: (id: string) => void;
  toggleFavorite: (id: string) => void;
  pushRecent: (id: string) => void;
  setActivePlaylist: (id: string | null) => void;
  setActiveCategory: (c: string) => void;

  // ephemeral (not persisted)
  playing: boolean;
  setPlaying: (p: boolean) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      currentSongId: null,
      position: 0,
      volume: 0.7,
      playbackRate: 1,
      shuffle: false,
      repeat: "off",
      queue: [],
      originalQueue: [],
      favorites: [],
      recentlyPlayed: [],
      activePlaylistId: null,
      activeCategory: "All",
      playing: false,

      setCurrent: (id) => set({ currentSongId: id, position: 0 }),
      setPosition: (p) => set({ position: p }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      setPlaybackRate: (r) => set({ playbackRate: Math.max(0.25, Math.min(3, r)) }),
      toggleShuffle: () => {
        const { shuffle, queue, originalQueue, currentSongId } = get();
        if (!shuffle) {
          const original = originalQueue.length ? originalQueue : queue;
          const rest = original.filter((id) => id !== currentSongId);
          const shuffled = currentSongId
            ? [currentSongId, ...shuffleArray(rest)]
            : shuffleArray(original);
          set({ shuffle: true, queue: shuffled, originalQueue: original });
        } else {
          set({ shuffle: false, queue: originalQueue.length ? originalQueue : queue });
        }
      },
      cycleRepeat: () =>
        set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),
      setQueue: (ids, originalOrder) =>
        set({ queue: ids, originalQueue: originalOrder ?? ids }),
      playFrom: (ids, startId) => {
        const { shuffle } = get();
        let q = ids;
        if (shuffle) {
          const rest = ids.filter((id) => id !== startId);
          q = [startId, ...shuffleArray(rest)];
        }
        set({ queue: q, originalQueue: ids, currentSongId: startId, position: 0, playing: true });
      },
      addToQueue: (id) => set((s) => ({ queue: [...s.queue, id], originalQueue: [...s.originalQueue, id] })),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [id, ...s.favorites],
        })),
      pushRecent: (id) =>
        set((s) => ({
          recentlyPlayed: [id, ...s.recentlyPlayed.filter((x) => x !== id)].slice(0, 50),
        })),
      setActivePlaylist: (id) => set({ activePlaylistId: id }),
      setActiveCategory: (c) => set({ activeCategory: c }),

      setPlaying: (p) => set({ playing: p }),
    }),
    {
      name: "study-music-v2",
      partialize: (s) => ({
        currentSongId: s.currentSongId,
        position: s.position,
        volume: s.volume,
        playbackRate: s.playbackRate,
        shuffle: s.shuffle,
        repeat: s.repeat,
        queue: s.queue,
        originalQueue: s.originalQueue,
        favorites: s.favorites,
        recentlyPlayed: s.recentlyPlayed,
        activePlaylistId: s.activePlaylistId,
        activeCategory: s.activeCategory,
      }),
    },
  ),
);

export const MUSIC_CATEGORIES = [
  "Deep Focus", "Coding", "Reading", "DSA", "Exam", "Long Session",
  "Rain", "Brown Noise", "White Noise", "Lo-Fi", "Alpha Waves", "Phonk",
  "Movie Songs", "Motivation", "Nature", "Custom",
];
