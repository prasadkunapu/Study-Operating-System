
-- Songs library
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Custom',
  duration_seconds NUMERIC,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO anon, authenticated;
GRANT ALL ON public.songs TO service_role;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read songs" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Public insert songs" ON public.songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update songs" ON public.songs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete songs" ON public.songs FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.songs;

-- Playlists
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO anon, authenticated;
GRANT ALL ON public.playlists TO service_role;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read playlists" ON public.playlists FOR SELECT USING (true);
CREATE POLICY "Public insert playlists" ON public.playlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update playlists" ON public.playlists FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete playlists" ON public.playlists FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlists;

CREATE TABLE public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, song_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_songs TO anon, authenticated;
GRANT ALL ON public.playlist_songs TO service_role;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read playlist_songs" ON public.playlist_songs FOR SELECT USING (true);
CREATE POLICY "Public insert playlist_songs" ON public.playlist_songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update playlist_songs" ON public.playlist_songs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete playlist_songs" ON public.playlist_songs FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_songs;

-- Allow anonymous public uploads to the music bucket
CREATE POLICY "Public read music" ON storage.objects FOR SELECT USING (bucket_id = 'music');
CREATE POLICY "Public upload music" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'music');
CREATE POLICY "Public update music" ON storage.objects FOR UPDATE USING (bucket_id = 'music');
CREATE POLICY "Public delete music" ON storage.objects FOR DELETE USING (bucket_id = 'music');
