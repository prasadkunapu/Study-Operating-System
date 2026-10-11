import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Music, X, Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX,
  Upload, Trash2, Shuffle, Repeat, Repeat1, Heart, ListMusic, Search, Plus, Gauge,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMusicStore, MUSIC_CATEGORIES, type CloudSong } from "@/lib/music-store";
import {
  listSongs, uploadSong, deleteSong, getSignedUrl, updateSongDuration,
  listPlaylists, createPlaylist, deletePlaylist, listPlaylistSongIds, addSongToPlaylist,
} from "@/lib/music-api";
import { formatDuration } from "@/lib/time-format";

const RATES = [0.75, 1, 1.25, 1.5, 2];

export function MusicPlayer() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "queue" | "playlists" | "favorites">("library");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const restoredRef = useRef(false);

  const {
    currentSongId, position, volume, playbackRate, playing, shuffle, repeat,
    queue, favorites, activeCategory, activePlaylistId,
    setCurrent, setPosition, setVolume, setPlaybackRate, setPlaying,
    toggleShuffle, cycleRepeat, playFrom, toggleFavorite, pushRecent,
    setActiveCategory, setActivePlaylist, addToQueue,
  } = useMusicStore();

  const songsQ = useQuery({ queryKey: ["songs"], queryFn: listSongs });
  const playlistsQ = useQuery({ queryKey: ["playlists"], queryFn: listPlaylists });
  const playlistSongsQ = useQuery({
    queryKey: ["playlist-songs", activePlaylistId],
    queryFn: () => listPlaylistSongIds(activePlaylistId!),
    enabled: !!activePlaylistId,
  });

  const songs = songsQ.data ?? [];
  const songMap = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const current: CloudSong | null = currentSongId ? songMap.get(currentSongId) ?? null : null;

  // Realtime — refresh library on any change from other devices
  useEffect(() => {
    const ch = supabase
      .channel("music-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "songs" }, () => {
        qc.invalidateQueries({ queryKey: ["songs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "playlists" }, () => {
        qc.invalidateQueries({ queryKey: ["playlists"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "playlist_songs" }, () => {
        qc.invalidateQueries({ queryKey: ["playlist-songs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  // Filtered library
  const filtered = useMemo(() => {
    let list = songs;
    if (activeCategory !== "All") list = list.filter((s) => s.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    }
    return list;
  }, [songs, activeCategory, search]);

  // Load signed URL when currentSongId changes
  useEffect(() => {
    let cancelled = false;
    if (!current) { setCurrentUrl(null); return; }
    (async () => {
      try {
        const url = await getSignedUrl(current.storage_path);
        if (!cancelled) setCurrentUrl(url);
      } catch (e) {
        console.error("signed url failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [current]);

  // Sync <audio> element with store: play/pause, volume, rate
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
  }, [volume]);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = playbackRate;
  }, [playbackRate]);
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !currentUrl) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, currentUrl, setPlaying]);

  // Resume last position ONCE when audio loads (Spotify-style resume across nav & reload)
  useEffect(() => { restoredRef.current = false; }, [currentSongId]);
  const onLoadedMetadata = () => {
    const a = audioRef.current;
    if (!a) return;
    setDuration(a.duration || 0);
    if (!restoredRef.current && position > 0 && position < (a.duration || Infinity)) {
      a.currentTime = position;
    }
    restoredRef.current = true;
    if (current && a.duration && !current.duration_seconds) {
      updateSongDuration(current.id, a.duration).catch(() => {});
    }
  };
  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setPosition(a.currentTime);
  };
  const onEnded = () => {
    if (repeat === "one") {
      const a = audioRef.current;
      if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      return;
    }
    playNext();
  };

  function playNext() {
    if (!queue.length || !currentSongId) return;
    const idx = queue.indexOf(currentSongId);
    let nextIdx = idx + 1;
    if (nextIdx >= queue.length) {
      if (repeat === "all") nextIdx = 0;
      else { setPlaying(false); return; }
    }
    const nextId = queue[nextIdx];
    setCurrent(nextId);
    pushRecent(nextId);
    setPlaying(true);
  }
  function playPrev() {
    const a = audioRef.current;
    if (a && a.currentTime > 3) { a.currentTime = 0; return; }
    if (!queue.length || !currentSongId) return;
    const idx = queue.indexOf(currentSongId);
    const prevIdx = idx <= 0 ? (repeat === "all" ? queue.length - 1 : 0) : idx - 1;
    const prevId = queue[prevIdx];
    setCurrent(prevId);
    pushRecent(prevId);
    setPlaying(true);
  }

  // Ensure queue is populated on first play
  const playSong = (song: CloudSong, sourceList: CloudSong[]) => {
    const ids = sourceList.map((s) => s.id);
    playFrom(ids, song.id);
    pushRecent(song.id);
  };

  // Uploads
  const uploadM = useMutation({
    mutationFn: async (files: File[]) => {
      const cat = activeCategory === "All" ? "Custom" : activeCategory;
      for (const f of files) await uploadSong(f, cat);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["songs"] }),
  });
  const deleteM = useMutation({
    mutationFn: (s: CloudSong) => deleteSong(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["songs"] }),
  });
  const createPlM = useMutation({
    mutationFn: (name: string) => createPlaylist(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlists"] }),
  });
  const deletePlM = useMutation({
    mutationFn: (id: string) => deletePlaylist(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlists"] }),
  });
  const addToPlM = useMutation({
    mutationFn: ({ pid, sid }: { pid: string; sid: string }) => addSongToPlaylist(pid, sid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlist-songs"] }),
  });

  const onUpload = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    try { await uploadM.mutateAsync(Array.from(fileList)); } finally { setUploading(false); }
  };

  const VolIcon = volume === 0 ? VolumeX : volume < 0.4 ? Volume1 : Volume2;
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  // Queue view resolves ids -> songs
  const queueSongs = queue.map((id) => songMap.get(id)).filter(Boolean) as CloudSong[];
  const favoriteSongs = favorites.map((id) => songMap.get(id)).filter(Boolean) as CloudSong[];
  const playlistView =
    activePlaylistId && playlistSongsQ.data
      ? (playlistSongsQ.data.map((id) => songMap.get(id)).filter(Boolean) as CloudSong[])
      : [];

  return (
    <>
      {/* Floating button (persistent across nav) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open music hub"
        className="glass-strong glow-primary fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95"
        style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 30%, var(--card)), var(--card))" }}
      >
        <Music className="h-6 w-6" style={{ color: "var(--primary)" }} />
        {playing && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-0.5 pb-3">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="block w-0.5 rounded-full"
                style={{ height: 10, background: "var(--primary)", transformOrigin: "bottom",
                  animation: `eq 0.8s ease-in-out ${i * 0.12}s infinite` }} />
            ))}
          </div>
        )}
      </button>

      {/* Persistent audio element — never unmounts */}
      <audio
        ref={audioRef}
        src={currentUrl ?? undefined}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => { /* keep store in sync only if not caused by store */ }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
      />

      {/* Mini-player bar (visible when a track is loaded and sheet closed) */}
      {current && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed inset-x-3 bottom-20 z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl glass-strong px-3 py-2 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            {playing ? <Pause className="h-4 w-4 text-primary-foreground" /> : <Play className="h-4 w-4 text-primary-foreground" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{current.name}</div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-[width]"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))" }} />
            </div>
          </div>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setPlaying(!playing); }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full glass"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </span>
        </button>
      )}

      {/* Full sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-lg animate-fade-up rounded-t-3xl p-5 sm:rounded-3xl max-h-[92dvh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {buffering ? "Buffering…" : playing ? "Now playing" : "Paused"}
                </div>
                <div className="truncate text-lg font-semibold text-gradient">{current?.name ?? "No track selected"}</div>
                {current && (
                  <div className="text-[11px] text-muted-foreground">{current.category}</div>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Waveform / EQ */}
            <div className="glass mb-3 flex h-20 items-end justify-center gap-1 rounded-2xl p-3">
              {Array.from({ length: 44 }).map((_, i) => (
                <span key={i} className="w-1 rounded-full"
                  style={{
                    height: `${20 + ((i * 37) % 70)}%`,
                    background: `linear-gradient(180deg, var(--primary), var(--accent))`,
                    transformOrigin: "bottom",
                    animation: playing ? `eq ${0.6 + (i % 5) * 0.1}s ease-in-out ${i * 0.03}s infinite` : "none",
                    opacity: playing ? 1 : 0.4,
                  }} />
              ))}
            </div>

            {/* Seek */}
            <div className="mb-2">
              <input
                type="range" min={0} max={Math.max(1, duration)} step={0.1}
                value={Math.min(position, duration || 0)}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  setPosition(t);
                  if (audioRef.current) audioRef.current.currentTime = t;
                }}
                className="w-full accent-[color:var(--primary)]"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{formatDuration(position)}</span>
                <span>{formatDuration(duration || current?.duration_seconds || 0)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={toggleShuffle}
                className={`rounded-full p-2 ${shuffle ? "text-foreground" : "text-muted-foreground"} hover:bg-white/5`}
                aria-label="Shuffle">
                <Shuffle className="h-5 w-5" />
              </button>
              <button onClick={playPrev} className="rounded-full p-3 hover:bg-white/5" aria-label="Previous">
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  if (!current && filtered.length) { playSong(filtered[0], filtered); return; }
                  setPlaying(!playing);
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full glow-primary"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                aria-label="Play/Pause"
              >
                {playing ? <Pause className="h-6 w-6 text-primary-foreground" /> : <Play className="h-6 w-6 text-primary-foreground" />}
              </button>
              <button onClick={playNext} className="rounded-full p-3 hover:bg-white/5" aria-label="Next">
                <SkipForward className="h-5 w-5" />
              </button>
              <button onClick={cycleRepeat}
                className={`rounded-full p-2 ${repeat !== "off" ? "text-foreground" : "text-muted-foreground"} hover:bg-white/5`}
                aria-label="Repeat">
                {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
              </button>
            </div>

            {/* Volume + rate + favorite */}
            <div className="mt-3 flex items-center gap-3">
              <VolIcon className="h-4 w-4 text-muted-foreground" />
              <input type="range" min={0} max={1} step={0.01} value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-[color:var(--primary)]" />
              <button
                onClick={() => {
                  const i = RATES.indexOf(playbackRate);
                  setPlaybackRate(RATES[(i + 1) % RATES.length]);
                }}
                className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              >
                <Gauge className="h-3.5 w-3.5" />{playbackRate}x
              </button>
              <button
                onClick={() => current && toggleFavorite(current.id)}
                className="rounded-full p-2 hover:bg-white/5"
                aria-label="Favorite"
              >
                <Heart className={`h-5 w-5 ${current && favorites.includes(current.id) ? "fill-current text-red-400" : "text-muted-foreground"}`} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1 rounded-2xl glass p-1 text-xs">
              {(["library", "queue", "playlists", "favorites"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 rounded-xl px-3 py-1.5 font-semibold capitalize ${
                    tab === t ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                  style={tab === t ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}>
                  {t}
                </button>
              ))}
            </div>

            {/* Panels */}
            <div className="mt-3 flex-1 overflow-y-auto rounded-2xl">
              {tab === "library" && (
                <div>
                  {/* Search */}
                  <div className="glass mb-2 flex items-center gap-2 rounded-2xl px-3 py-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search your cloud library…"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  </div>
                  {/* Categories */}
                  <div className="no-scrollbar -mx-1 mb-2 flex gap-2 overflow-x-auto pb-1">
                    {["All", ...MUSIC_CATEGORIES].map((c) => (
                      <button key={c} onClick={() => setActiveCategory(c)}
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          activeCategory === c ? "text-primary-foreground glow-primary" : "glass text-muted-foreground"
                        }`}
                        style={activeCategory === c ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <SongList
                    songs={filtered}
                    currentId={currentSongId}
                    favorites={favorites}
                    onPlay={(s) => playSong(s, filtered)}
                    onFavorite={(s) => toggleFavorite(s.id)}
                    onDelete={(s) => deleteM.mutate(s)}
                    onQueue={(s) => addToQueue(s.id)}
                    playlists={playlistsQ.data ?? []}
                    onAddToPlaylist={(pid, sid) => addToPlM.mutate({ pid, sid })}
                  />
                  {songsQ.isLoading && (
                    <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">Syncing library…</div>
                  )}
                  {!songsQ.isLoading && filtered.length === 0 && (
                    <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">
                      No tracks in this category yet. Upload MP3 / WAV / FLAC / AAC below.
                    </div>
                  )}
                </div>
              )}

              {tab === "queue" && (
                <SongList
                  songs={queueSongs}
                  currentId={currentSongId}
                  favorites={favorites}
                  onPlay={(s) => { setCurrent(s.id); setPlaying(true); pushRecent(s.id); }}
                  onFavorite={(s) => toggleFavorite(s.id)}
                  emptyLabel="Queue is empty. Play a track from your library to build a queue."
                />
              )}

              {tab === "favorites" && (
                <SongList
                  songs={favoriteSongs}
                  currentId={currentSongId}
                  favorites={favorites}
                  onPlay={(s) => playSong(s, favoriteSongs)}
                  onFavorite={(s) => toggleFavorite(s.id)}
                  emptyLabel="No favorites yet. Tap the heart on any track to save it here."
                />
              )}

              {tab === "playlists" && (
                <PlaylistsPanel
                  playlists={playlistsQ.data ?? []}
                  activeId={activePlaylistId}
                  onSelect={setActivePlaylist}
                  onCreate={(name) => createPlM.mutate(name)}
                  onDelete={(id) => { if (activePlaylistId === id) setActivePlaylist(null); deletePlM.mutate(id); }}
                >
                  {activePlaylistId && (
                    <SongList
                      songs={playlistView}
                      currentId={currentSongId}
                      favorites={favorites}
                      onPlay={(s) => playSong(s, playlistView)}
                      onFavorite={(s) => toggleFavorite(s.id)}
                      emptyLabel="Playlist is empty. Add tracks from the library."
                    />
                  )}
                </PlaylistsPanel>
              )}
            </div>

            {/* Upload */}
            <div className="mt-3 flex items-center gap-2">
              <label className="glass flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading to cloud…" : `Upload to "${activeCategory === "All" ? "Custom" : activeCategory}"`}
                <input type="file" accept="audio/*" multiple hidden
                  onChange={(e) => onUpload(e.target.files)} />
              </label>
              {current && (
                <button
                  onClick={() => deleteM.mutate(current)}
                  className="glass rounded-2xl p-3 text-muted-foreground hover:text-destructive"
                  aria-label="Remove current track"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground/70">
              Cloud library — everything you upload syncs instantly across every device.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function SongList({
  songs, currentId, favorites, onPlay, onFavorite, onDelete, onQueue,
  playlists, onAddToPlaylist, emptyLabel,
}: {
  songs: CloudSong[]; currentId: string | null; favorites: string[];
  onPlay: (s: CloudSong) => void; onFavorite: (s: CloudSong) => void;
  onDelete?: (s: CloudSong) => void; onQueue?: (s: CloudSong) => void;
  playlists?: { id: string; name: string }[]; onAddToPlaylist?: (pid: string, sid: string) => void;
  emptyLabel?: string;
}) {
  if (!songs.length) return (
    <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">
      {emptyLabel ?? "Nothing here yet."}
    </div>
  );
  return (
    <div className="space-y-1">
      {songs.map((s) => {
        const active = s.id === currentId;
        return (
          <div key={s.id}
            className={`group flex items-center gap-2 rounded-xl px-2 py-2 ${active ? "bg-white/5" : "hover:bg-white/5"}`}>
            <button onClick={() => onPlay(s)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: active
                  ? "linear-gradient(135deg, var(--primary), var(--accent))"
                  : "color-mix(in oklab, var(--card) 60%, transparent)" }}>
                <Play className={`h-3.5 w-3.5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm ${active ? "font-semibold" : ""}`}>{s.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.category}{s.duration_seconds ? ` · ${formatDuration(s.duration_seconds)}` : ""}
                </div>
              </div>
            </button>
            <button onClick={() => onFavorite(s)} className="rounded-full p-1.5 text-muted-foreground hover:text-red-400" aria-label="Favorite">
              <Heart className={`h-4 w-4 ${favorites.includes(s.id) ? "fill-current text-red-400" : ""}`} />
            </button>
            {onQueue && (
              <button onClick={() => onQueue(s)} className="rounded-full p-1.5 text-muted-foreground hover:text-foreground" aria-label="Add to queue">
                <ListMusic className="h-4 w-4" />
              </button>
            )}
            {playlists && playlists.length > 0 && onAddToPlaylist && (
              <select
                onChange={(e) => { if (e.target.value) { onAddToPlaylist(e.target.value, s.id); e.target.value = ""; } }}
                className="glass rounded-full bg-transparent px-2 py-1 text-[10px] text-muted-foreground"
                defaultValue=""
                aria-label="Add to playlist"
              >
                <option value="" disabled>+ Playlist</option>
                {playlists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {onDelete && (
              <button onClick={() => onDelete(s)} className="rounded-full p-1.5 text-muted-foreground hover:text-destructive" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlaylistsPanel({
  playlists, activeId, onSelect, onCreate, onDelete, children,
}: {
  playlists: { id: string; name: string }[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  children?: React.ReactNode;
}) {
  const [name, setName] = useState("");
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name"
          className="glass flex-1 rounded-2xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground" />
        <button
          onClick={() => { if (name.trim()) { onCreate(name.trim()); setName(""); } }}
          className="rounded-2xl px-3 py-2 text-primary-foreground glow-primary"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
          aria-label="Create playlist"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            !activeId ? "text-primary-foreground glow-primary" : "glass text-muted-foreground"
          }`}
          style={!activeId ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}>
          All
        </button>
        {playlists.map((p) => (
          <div key={p.id} className="flex items-center">
            <button onClick={() => onSelect(p.id)}
              className={`shrink-0 rounded-l-full px-3 py-1.5 text-xs font-medium ${
                activeId === p.id ? "text-primary-foreground glow-primary" : "glass text-muted-foreground"
              }`}
              style={activeId === p.id ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}>
              {p.name}
            </button>
            <button onClick={() => onDelete(p.id)}
              className={`shrink-0 rounded-r-full px-2 py-1.5 text-xs ${
                activeId === p.id ? "glow-primary text-primary-foreground/80" : "glass text-muted-foreground"
              }`}
              style={activeId === p.id ? { background: "linear-gradient(135deg, var(--primary), var(--accent))" } : undefined}
              aria-label="Delete playlist"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      {activeId ? children : (
        <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">
          Select a playlist above, or create one to organize your library.
        </div>
      )}
    </div>
  );
}
