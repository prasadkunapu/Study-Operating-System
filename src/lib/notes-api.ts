import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;
const BUCKET = "study-sheets";

// Phone → email mapping so we can use Supabase email/password auth under the hood
export function phoneToEmail(phone: string) {
  return `${phone.trim()}@studyos.local`;
}

export interface StudyJournal {
  id: string;
  user_id: string;
  entry_date: string;
  day_name: string;
  day_number: number;
  subject: string;
  topics_html: string;
  study_hours: number;
  achievement: string;
  notes: string;
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudySheet {
  id: string;
  user_id: string;
  journal_id: string | null;
  title: string;
  subject: string;
  entry_date: string;
  day_number: number;
  study_hours: number;
  png_path: string;
  pdf_path: string | null;
  favorite: boolean;
  created_at: string;
}

export async function listJournals(): Promise<StudyJournal[]> {
  const { data, error } = await sb
    .from("study_journals")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertJournal(
  payload: Omit<StudyJournal, "id" | "user_id" | "created_at" | "updated_at"> & { id?: string },
): Promise<StudyJournal> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const row = { ...payload, user_id: u.user.id };
  const q = payload.id
    ? sb.from("study_journals").update(row).eq("id", payload.id).select().single()
    : sb.from("study_journals").insert(row).select().single();
  const { data, error } = await q;
  if (error) throw error;
  return data as StudyJournal;
}

export async function deleteJournal(id: string) {
  const { error } = await sb.from("study_journals").delete().eq("id", id);
  if (error) throw error;
}

export async function listSheets(): Promise<StudySheet[]> {
  const { data, error } = await sb
    .from("study_sheets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteSheet(sheet: StudySheet) {
  const paths = [sheet.png_path, sheet.pdf_path].filter(Boolean) as string[];
  if (paths.length) await sb.storage.from(BUCKET).remove(paths);
  const { error } = await sb.from("study_sheets").delete().eq("id", sheet.id);
  if (error) throw error;
}

export async function updateSheet(id: string, patch: Partial<StudySheet>) {
  const { error } = await sb.from("study_sheets").update(patch).eq("id", id);
  if (error) throw error;
}

export async function uploadSheetFiles(opts: {
  userId: string;
  pngBlob: Blob;
  pdfBlob: Blob;
}) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pngPath = `${opts.userId}/${stamp}.png`;
  const pdfPath = `${opts.userId}/${stamp}.pdf`;
  const up1 = await sb.storage.from(BUCKET).upload(pngPath, opts.pngBlob, {
    contentType: "image/png",
    upsert: false,
  });
  if (up1.error) throw up1.error;
  const up2 = await sb.storage.from(BUCKET).upload(pdfPath, opts.pdfBlob, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (up2.error) throw up2.error;
  return { pngPath, pdfPath };
}

export async function createSheetRow(row: Omit<StudySheet, "id" | "user_id" | "created_at" | "favorite"> & { favorite?: boolean }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { data, error } = await sb
    .from("study_sheets")
    .insert({ ...row, user_id: u.user.id, favorite: row.favorite ?? false })
    .select()
    .single();
  if (error) throw error;
  return data as StudySheet;
}

const urlCache = new Map<string, { url: string; exp: number }>();
export async function signedSheetUrl(path: string, ttl = 3600) {
  const now = Date.now();
  const c = urlCache.get(path);
  if (c && c.exp > now + 60_000) return c.url;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, ttl);
  if (error) throw error;
  urlCache.set(path, { url: data.signedUrl, exp: now + ttl * 1000 });
  return data.signedUrl as string;
}

export function dayName(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

// Day N = days since the earliest journal (or 1 if none / today is earliest)
export function computeDayNumber(entryDate: string, allDates: string[]): number {
  const dates = [...allDates, entryDate].sort();
  const first = dates[0];
  const a = new Date(first + "T00:00:00").getTime();
  const b = new Date(entryDate + "T00:00:00").getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}
