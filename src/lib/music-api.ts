import { supabase } from "@/integrations/supabase/client";
import type { CloudSong } from "./music-store";

// Types.ts is auto-generated and doesn't yet include our new tables in the type map.
// Use `as any` locally to keep the app strict elsewhere.
const sb = supabase as any;
const BUCKET = "music";

export interface CloudPlaylist {
  id: string;
  name: string;
  created_at: string;
}

export async function listSongs(): Promise<CloudSong[]> {
  const { data, error } = await sb
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudSong[];
}

export async function listPlaylists(): Promise<CloudPlaylist[]> {
  const { data, error } = await sb.from("playlists").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudPlaylist[];
}

export async function createPlaylist(name: string): Promise<CloudPlaylist> {
  const { data, error } = await sb.from("playlists").insert({ name }).select().single();
  if (error) throw error;
  return data as CloudPlaylist;
}

export async function deletePlaylist(id: string) {
  const { error } = await sb.from("playlists").delete().eq("id", id);
  if (error) throw error;
}

export async function addSongToPlaylist(playlistId: string, songId: string, position = 0) {
  const { error } = await sb
    .from("playlist_songs")
    .insert({ playlist_id: playlistId, song_id: songId, position });
  if (error && !`${error.message}`.includes("duplicate")) throw error;
}

export async function removeSongFromPlaylist(playlistId: string, songId: string) {
  const { error } = await sb
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);
  if (error) throw error;
}

export async function listPlaylistSongIds(playlistId: string): Promise<string[]> {
  const { data, error } = await sb
    .from("playlist_songs")
    .select("song_id, position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as { song_id: string }[]).map((r) => r.song_id);
}

export async function uploadSong(file: File, category: string): Promise<CloudSong> {
  const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const up = await sb.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (up.error) throw up.error;

  const name = file.name.replace(/\.[^.]+$/, "");
  const { data, error } = await sb
    .from("songs")
    .insert({
      name,
      storage_path: path,
      category,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select()
    .single();
  if (error) {
    await sb.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data as CloudSong;
}

export async function deleteSong(song: CloudSong) {
  await sb.storage.from(BUCKET).remove([song.storage_path]);
  const { error } = await sb.from("songs").delete().eq("id", song.id);
  if (error) throw error;
}

// Cache of signed URLs, refreshed before expiry (1h TTL).
const urlCache = new Map<string, { url: string; exp: number }>();

export async function getSignedUrl(storagePath: string): Promise<string> {
  const now = Date.now();
  const cached = urlCache.get(storagePath);
  if (cached && cached.exp > now + 60_000) return cached.url;

  const ttl = 60 * 60; // 1 hour
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(storagePath, ttl);
  if (error) throw error;
  const url = data.signedUrl as string;
  urlCache.set(storagePath, { url, exp: now + ttl * 1000 });
  return url;
}

export async function updateSongDuration(songId: string, duration: number) {
  await sb.from("songs").update({ duration_seconds: duration }).eq("id", songId);
}
