
-- ============ study_journals ============
CREATE TABLE public.study_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  day_name text NOT NULL,
  day_number integer NOT NULL DEFAULT 1,
  subject text NOT NULL,
  topics_html text NOT NULL DEFAULT '',
  study_hours numeric(5,2) NOT NULL DEFAULT 0,
  achievement text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  favorite boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_journals TO authenticated;
GRANT ALL ON public.study_journals TO service_role;
ALTER TABLE public.study_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own journals" ON public.study_journals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ study_sheets ============
CREATE TABLE public.study_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_id uuid REFERENCES public.study_journals(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Study Sheet',
  subject text NOT NULL DEFAULT '',
  entry_date date NOT NULL,
  day_number integer NOT NULL DEFAULT 1,
  study_hours numeric(5,2) NOT NULL DEFAULT 0,
  png_path text NOT NULL,
  pdf_path text,
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sheets TO authenticated;
GRANT ALL ON public.study_sheets TO service_role;
ALTER TABLE public.study_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sheets" ON public.study_sheets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_journals_updated BEFORE UPDATE ON public.study_journals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sheets_updated BEFORE UPDATE ON public.study_sheets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_journals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sheets;

-- ============ Storage RLS for study-sheets bucket (owner path: <uid>/...) ============
CREATE POLICY "Sheets read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'study-sheets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Sheets insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'study-sheets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Sheets update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'study-sheets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Sheets delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'study-sheets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ Reset testing data (keep schema) ============
DELETE FROM public.playlist_songs;
DELETE FROM public.playlists;
DELETE FROM public.songs;

-- ============ Seed Notes account (phone 8639675436 / password note007) ============
-- We map phone to a synthetic email so Supabase email/password auth works.
DO $seed$
DECLARE
  v_email text := '8639675436@studyos.local';
  v_password text := 'note007';
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Siddu","phone":"8639675436"}'::jsonb,
      false, false
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
      'email', v_email, now(), now(), now());
  END IF;
END $seed$;
