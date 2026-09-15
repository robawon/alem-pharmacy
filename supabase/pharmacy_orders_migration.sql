-- ============================================================
-- Alem Pharmacy PMS — pharmacy_orders table
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
-- This creates the dedicated table for pharmacist-to-cashier
-- in-person orders with correct status values and Realtime.
-- ============================================================

-- 1. Create the pharmacy_orders table
create table if not exists public.pharmacy_orders (
  id text primary key default gen_random_uuid()::text,
  patient_name text not null,
  items jsonb not null default '[]',
  subtotal numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  status text not null default 'pending_cashier' check (
    status in ('pending_cashier', 'ready_for_checkout', 'completed', 'cancelled')
  ),
  created_by text not null,
  created_at timestamptz not null default now(),
  received_by text,
  received_at timestamptz,
  completed_at timestamptz,
  sale_id text  -- tracks completed_sales.id to prevent duplicate sale creation on double-click
);

-- 2. Enable Row Level Security
alter table public.pharmacy_orders enable row level security;

-- 3. RLS Policy: all authenticated users (pharmacists, cashiers, admins) can read/write
create policy "Allow all for authenticated"
  on public.pharmacy_orders
  for all
  using (true);

-- 4. Enable Supabase Realtime so INSERT/UPDATE/DELETE events
--    are broadcast to all connected browser sessions instantly
alter publication supabase_realtime add table public.pharmacy_orders;

-- Verification queries (run after to confirm):
-- select table_name from information_schema.tables
--   where table_schema = 'public' and table_name = 'pharmacy_orders';
-- select * from pg_publication_tables
--   where tablename = 'pharmacy_orders';
