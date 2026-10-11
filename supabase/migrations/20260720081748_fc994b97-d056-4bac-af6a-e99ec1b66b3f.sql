
-- Repair the Notes user so email/password sign-in works.
-- The prior seed left NULL in gotrue string columns which causes:
-- "converting NULL to string is unsupported" during /token.
DO $$
DECLARE
  target_email text := '8639675436@studyos.local';
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = target_email;

  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      target_email, crypt('note007', gen_salt('bf')),
      now(), now(), now(),
      '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, uid::text,
            jsonb_build_object('sub', uid::text, 'email', target_email, 'email_verified', true),
            'email', now(), now(), now());
  ELSE
    UPDATE auth.users SET
      encrypted_password = crypt('note007', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = COALESCE(confirmation_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      recovery_token = COALESCE(recovery_token, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      updated_at = now(),
      banned_until = NULL
    WHERE id = uid;

    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = uid AND provider = 'email') THEN
      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), uid, uid::text,
              jsonb_build_object('sub', uid::text, 'email', target_email, 'email_verified', true),
              'email', now(), now(), now());
    END IF;
  END IF;
END $$;
