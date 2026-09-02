-- ============================================================
-- Alem Pharmacy PMS — Complete Reset & Initial Admin Seed
-- ============================================================

-- 1. Temporarily drop audit log delete rule to allow cleanup
DROP RULE IF EXISTS audit_logs_no_delete ON public.audit_logs;

-- 2. Truncate dependent tables
TRUNCATE TABLE public.prescriptions CASCADE;
TRUNCATE TABLE public.customer_orders CASCADE;
TRUNCATE TABLE public.completed_sales CASCADE;
TRUNCATE TABLE public.uploaded_prescriptions CASCADE;
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.staff_profiles CASCADE;

-- Re-apply audit_logs rule
CREATE OR REPLACE RULE audit_logs_no_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- 3. Delete all auth users safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DELETE FROM auth.users;
  END IF;
END $$;

-- 4. Create Initial Admin User in auth.users
-- Email: admin@alempharma.et
-- Password: AdminPassword123!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@alempharma.et',
  crypt('AdminPassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "System Administrator", "role": "admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('AdminPassword123!', gen_salt('bf')),
  email_confirmed_at = now();

-- 5. Create Matching Admin Profile in staff_profiles
INSERT INTO public.staff_profiles (
  id,
  name,
  email,
  role,
  status,
  is_verified,
  is_active,
  joined_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'System Administrator',
  'admin@alempharma.et',
  'admin',
  'active',
  true,
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  is_verified = true,
  is_active = true;

-- 6. Verification Check
SELECT id, email, role, is_verified, status FROM public.staff_profiles;
