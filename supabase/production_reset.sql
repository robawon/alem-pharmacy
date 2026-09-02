-- ============================================================
-- Alem Pharmacy PMS — Safe Production Reset Script
-- Run this script in the Supabase SQL Editor (Project -> SQL Editor)
-- to purge all demo data while preserving the primary Admin account.
-- ============================================================

DO $$
DECLARE
  -- Set your primary administrator email or ID to preserve
  ADMIN_EMAIL text := 'selam.tesfaye@alempharma.et';
  ADMIN_ID    text := 'u_admin1';
BEGIN
  RAISE NOTICE 'Starting Alem Pharmacy PMS Production Reset...';

  -- 1. Clear Demo Business Transactions & Orders
  TRUNCATE TABLE public.prescriptions CASCADE;
  TRUNCATE TABLE public.customer_orders CASCADE;
  TRUNCATE TABLE public.completed_sales CASCADE;
  TRUNCATE TABLE public.uploaded_prescriptions CASCADE;
  TRUNCATE TABLE public.audit_logs CASCADE;

  -- 2. Clear Demo Stock & Catalog Data
  TRUNCATE TABLE public.catalog_items CASCADE;
  TRUNCATE TABLE public.inventory CASCADE;

  -- 3. Preserve Primary Admin Profile & Delete Non-Admin Staff Profiles
  DELETE FROM public.staff_profiles
  WHERE email <> ADMIN_EMAIL AND id <> ADMIN_ID;

  -- 4. Delete Non-Admin Users from Supabase Auth (if auth.users exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DELETE FROM auth.users
    WHERE email <> ADMIN_EMAIL AND id::text <> ADMIN_ID;
  END IF;

  RAISE NOTICE 'Production reset complete! All demo data wiped and Admin user preserved.';
END $$;

-- ============================================================
-- VERIFICATION REPORT
-- Run these count queries to confirm table reset status
-- ============================================================

SELECT 'staff_profiles (Admin preserved)' AS table_name, count(*) AS total_records FROM public.staff_profiles
UNION ALL
SELECT 'auth.users (Admin preserved)' AS table_name, count(*) AS total_records FROM auth.users
UNION ALL
SELECT 'inventory (Reset to 0)' AS table_name, count(*) AS total_records FROM public.inventory
UNION ALL
SELECT 'catalog_items (Reset to 0)' AS table_name, count(*) AS total_records FROM public.catalog_items
UNION ALL
SELECT 'customer_orders (Reset to 0)' AS table_name, count(*) AS total_records FROM public.customer_orders
UNION ALL
SELECT 'prescriptions (Reset to 0)' AS table_name, count(*) AS total_records FROM public.prescriptions
UNION ALL
SELECT 'completed_sales (Reset to 0)' AS table_name, count(*) AS total_records FROM public.completed_sales
UNION ALL
SELECT 'uploaded_prescriptions (Reset to 0)' AS table_name, count(*) AS total_records FROM public.uploaded_prescriptions
UNION ALL
SELECT 'audit_logs (Reset to 0)' AS table_name, count(*) AS total_records FROM public.audit_logs;
