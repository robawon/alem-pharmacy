-- ============================================================
-- Alem Pharmacy PMS — Supabase Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
-- ============================================================
-- Enable UUID extension
create extension if not exists "pgcrypto";
-- ── Staff Profiles ───────────────────────────────────────────
create table if not exists public.staff_profiles (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null unique,
  role text not null check (
    role in (
      'admin',
      'pharmacist',
      'cashier',
      'inventory',
      'customer'
    )
  ),
  status text not null default 'active' check (status in ('active', 'suspended')),
  is_verified boolean not null default false,
  is_active boolean not null default true,
  avatar_url text,
  joined_at timestamptz not null default now()
);
alter table public.staff_profiles enable row level security;
create policy "Allow all for authenticated" on public.staff_profiles for all using (true);
-- ── Stock Inventory ──────────────────────────────────────────
create table if not exists public.inventory (
  id text primary key default gen_random_uuid()::text,
  drug_name text not null,
  batch_number text not null,
  expiry_date date not null,
  safety_threshold int not null default 50,
  unit_price numeric(10, 2) not null,
  quantity int not null default 0,
  quarantined boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.inventory enable row level security;
create policy "Allow all for authenticated" on public.inventory for all using (true);
-- ── Prescriptions ────────────────────────────────────────────
create table if not exists public.prescriptions (
  id text primary key default gen_random_uuid()::text,
  patient_name text not null,
  doctor_name text not null,
  patient_history text [] not null default '{}',
  drug_name text not null,
  batch_id text references public.inventory(id),
  dosage text not null,
  prescription_text text not null,
  conflict_warning text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  rejected_at timestamptz
);
alter table public.prescriptions enable row level security;
create policy "Allow all for authenticated" on public.prescriptions for all using (true);
-- ── Audit Logs ───────────────────────────────────────────────
create table if not exists public.audit_logs (
  id text primary key default gen_random_uuid()::text,
  timestamp timestamptz not null default now(),
  action_type text not null,
  user_id text not null default 'system',
  user_role text not null default 'admin',
  payload_delta text not null
);
alter table public.audit_logs enable row level security;
create policy "Allow all for authenticated" on public.audit_logs for all using (true);
-- ── Medicine Catalog ─────────────────────────────────────────
create table if not exists public.catalog_items (
  id text primary key default gen_random_uuid()::text,
  drug_name text not null,
  generic_name text not null,
  dosage text not null,
  category text not null check (
    category in ('otc', 'prescription', 'vitamins', 'first_aid')
  ),
  is_rx boolean not null default false,
  unit_price numeric(10, 2) not null,
  quantity int not null default 0,
  in_stock boolean not null default true,
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.catalog_items enable row level security;
create policy "Allow all for authenticated" on public.catalog_items for all using (true);
-- ── Customer Orders ──────────────────────────────────────────
create table if not exists public.customer_orders (
  id text primary key default gen_random_uuid()::text,
  patient_name text not null,
  items text [] not null default '{}',
  is_rx boolean not null default false,
  status text not null default 'placed' check (
    status in (
      'placed',
      'pharmacist_review',
      'preparing',
      'ready',
      'completed',
      'cancelled'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  pickup_ready boolean not null default false,
  contact_full_name text,
  contact_phone text,
  contact_email text,
  contact_address text,
  contact_notes text,
  prescription_file_name text,
  prescription_notes text
);
alter table public.customer_orders enable row level security;
create policy "Allow all for authenticated" on public.customer_orders for all using (true);
-- ── Completed Sales (POS) ────────────────────────────────────
create table if not exists public.completed_sales (
  id text primary key default gen_random_uuid()::text,
  items jsonb not null default '[]',
  subtotal numeric(10, 2) not null,
  discount jsonb,
  discount_amount numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('cash', 'card', 'mobile', 'other')),
  amount_tendered numeric(10, 2) not null,
  change_due numeric(10, 2) not null default 0,
  salesperson_id text,
  cashier_id text,
  timestamp timestamptz not null default now()
);
alter table public.completed_sales add column if not exists salesperson_id text;
alter table public.completed_sales add column if not exists cashier_id text;
alter table public.completed_sales drop constraint if exists completed_sales_payment_method_check;
alter table public.completed_sales add constraint completed_sales_payment_method_check check (payment_method in ('cash', 'card', 'mobile', 'other'));
alter table public.completed_sales drop constraint if exists completed_sales_cashier_id_fkey;
alter table public.completed_sales drop constraint if exists completed_sales_salesperson_id_fkey;
alter table public.completed_sales add constraint completed_sales_cashier_id_fkey foreign key (cashier_id) references public.staff_profiles(id) on delete set null;
alter table public.completed_sales add constraint completed_sales_salesperson_id_fkey foreign key (salesperson_id) references public.staff_profiles(id) on delete set null;
alter table public.completed_sales enable row level security;
create policy "Allow all for authenticated" on public.completed_sales for all using (true);
-- ── Uploaded Prescriptions (Customer Portal) ─────────────────
create table if not exists public.uploaded_prescriptions (
  id text primary key default gen_random_uuid()::text,
  file_name text not null,
  file_url text,
  doctor_name text not null,
  target_drug_name text,
  patient_notes text,
  requested_quantity int not null default 1,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'approved', 'rejected')
  ),
  uploaded_at timestamptz not null default now(),
  user_id text
);
alter table public.uploaded_prescriptions add column if not exists requested_quantity int not null default 1;
alter table public.uploaded_prescriptions enable row level security;
create policy "Allow all for authenticated" on public.uploaded_prescriptions for all using (true);
-- ── Seed Initial Data ────────────────────────────────────────
insert into public.staff_profiles (
    id,
    name,
    email,
    role,
    status,
    is_verified,
    is_active
  )
values (
    'u_admin1',
    'Selam Tesfaye',
    'selam.tesfaye@alempharma.et',
    'admin',
    'active',
    true,
    true
  ),
  (
    'u_pharm1',
    'Dr. Bethel Alemu',
    'bethel.alemu@alempharma.et',
    'pharmacist',
    'active',
    true,
    true
  ),
  (
    'u_cash1',
    'Yonas Girma',
    'yonas.girma@alempharma.et',
    'cashier',
    'active',
    true,
    true
  ),
  (
    'u_inv1',
    'Hana Desta',
    'hana.desta@alempharma.et',
    'inventory',
    'active',
    true,
    true
  ),
  (
    'u_pharm2',
    'Dr. Mekdes Fikre',
    'mekdes.fikre@alempharma.et',
    'pharmacist',
    'suspended',
    true,
    false
  ) on conflict (id) do nothing;
insert into public.inventory (
    id,
    drug_name,
    batch_number,
    expiry_date,
    safety_threshold,
    unit_price,
    quantity
  )
values (
    'b_001',
    'Amoxicillin 500mg',
    'AMX-2024-118',
    '2026-11-30',
    50,
    2.50,
    420
  ),
  (
    'b_002',
    'Paracetamol 500mg',
    'PCM-2025-002',
    '2027-04-15',
    100,
    0.80,
    980
  ),
  (
    'b_003',
    'Warfarin 5mg',
    'WFN-2024-077',
    '2026-08-01',
    20,
    4.20,
    65
  ),
  (
    'b_004',
    'Metformin 850mg',
    'MTF-2023-441',
    '2026-01-10',
    40,
    1.90,
    18
  ),
  (
    'b_005',
    'Ibuprofen 400mg',
    'IBU-2025-019',
    '2027-09-22',
    60,
    1.10,
    512
  ),
  (
    'b_006',
    'Insulin Glargine',
    'INS-2024-305',
    '2026-02-28',
    15,
    18.75,
    22
  ) on conflict (id) do nothing;
insert into public.catalog_items (
    id,
    drug_name,
    generic_name,
    dosage,
    category,
    is_rx,
    unit_price,
    quantity,
    in_stock
  )
values (
    'cat_001',
    'Paracetamol 500mg',
    'Acetaminophen',
    '500mg',
    'otc',
    false,
    0.80,
    980,
    true
  ),
  (
    'cat_002',
    'Ibuprofen 400mg',
    'Ibuprofen',
    '400mg',
    'otc',
    false,
    1.10,
    512,
    true
  ),
  (
    'cat_003',
    'Loratadine 10mg',
    'Loratadine',
    '10mg',
    'otc',
    false,
    0.50,
    340,
    true
  ),
  (
    'cat_004',
    'Amoxicillin 500mg',
    'Amoxicillin',
    '500mg',
    'prescription',
    true,
    2.50,
    420,
    true
  ),
  (
    'cat_005',
    'Metformin 850mg',
    'Metformin HCl',
    '850mg',
    'prescription',
    true,
    1.90,
    18,
    true
  ),
  (
    'cat_006',
    'Warfarin 5mg',
    'Warfarin Sodium',
    '5mg',
    'prescription',
    true,
    4.20,
    65,
    true
  ),
  (
    'cat_007',
    'Insulin Glargine',
    'Insulin Glargine',
    '100U/mL',
    'prescription',
    true,
    18.75,
    22,
    true
  ),
  (
    'cat_008',
    'Vitamin D3 1000IU',
    'Cholecalciferol',
    '1000IU',
    'vitamins',
    false,
    0.30,
    650,
    true
  ),
  (
    'cat_009',
    'Vitamin C 500mg',
    'Ascorbic Acid',
    '500mg',
    'vitamins',
    false,
    0.25,
    720,
    true
  ),
  (
    'cat_010',
    'Multivitamin Daily',
    'Multivitamin',
    '1 tablet',
    'vitamins',
    false,
    0.60,
    410,
    true
  ),
  (
    'cat_011',
    'First Aid Bandages',
    'Adhesive Bandage',
    'Assorted',
    'first_aid',
    false,
    2.00,
    200,
    true
  ),
  (
    'cat_012',
    'Antiseptic Cream',
    'Bacitracin',
    '1oz tube',
    'first_aid',
    false,
    3.50,
    150,
    true
  ),
  (
    'cat_013',
    'Cetirizine 10mg',
    'Cetirizine HCl',
    '10mg',
    'otc',
    false,
    0.45,
    280,
    true
  ),
  (
    'cat_014',
    'Omeprazole 20mg',
    'Omeprazole',
    '20mg',
    'otc',
    false,
    0.90,
    195,
    true
  ) on conflict (id) do nothing;
insert into public.audit_logs (
    id,
    action_type,
    user_id,
    user_role,
    payload_delta
  )
select 'log_seed_1',
  'SHIPMENT_RECEIVED',
  'u_inv1',
  'inventory',
  'Received 200 units of Ibuprofen 400mg (batch IBU-2025-019)'
where not exists (
    select 1
    from public.audit_logs
    where id = 'log_seed_1'
  );
insert into public.audit_logs (
    id,
    action_type,
    user_id,
    user_role,
    payload_delta
  )
select 'log_seed_2',
  'PRESCRIPTION_VERIFIED',
  'u_pharm1',
  'pharmacist',
  'Verified prescription for Paracetamol 500mg — patient Frehiwot Assefa'
where not exists (
    select 1
    from public.audit_logs
    where id = 'log_seed_2'
  );
-- Append-only: disallow updates and deletes (added after initial seed)
create or replace rule audit_logs_no_update as on update to public.audit_logs do instead nothing;
create or replace rule audit_logs_no_delete as on delete to public.audit_logs do instead nothing;

-- ── Stock Increment RPCs (Atomic Inventory Restoration & Deduction) ───
create or replace function increment_inventory_stock(batch_id text, amount int)
returns void as $$
begin
  update public.inventory
  set quantity = quantity + amount
  where id = batch_id;
end;
$$ language plpgsql;

create or replace function increment_catalog_stock(catalog_id text, amount int)
returns void as $$
begin
  update public.catalog_items
  set quantity = quantity + amount,
      in_stock = (quantity + amount) > 0
  where id = catalog_id;
end;
$$ language plpgsql;

-- ── Atomic Stock Decrement RPCs (Safe Stock Reduction) ────────────────
create or replace function decrement_inventory_stock(batch_id text, amount int)
returns boolean as $$
declare
  curr_qty int;
begin
  select quantity into curr_qty from public.inventory where id = batch_id;
  if curr_qty is null or curr_qty < amount then
    return false;
  end if;

  update public.inventory
  set quantity = quantity - amount
  where id = batch_id;
  return true;
end;
$$ language plpgsql;

create or replace function decrement_catalog_stock(catalog_id text, amount int)
returns boolean as $$
declare
  curr_qty int;
begin
  select quantity into curr_qty from public.catalog_items where id = catalog_id;
  if curr_qty is null or curr_qty < amount then
    return false;
  end if;

  update public.catalog_items
  set quantity = quantity - amount,
      in_stock = (quantity - amount) > 0
  where id = catalog_id;
  return true;
end;
$$ language plpgsql;

-- ── Supabase Storage Bucket Setup ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', true)
on conflict (id) do nothing;

create policy "Prescription Images Public Select"
  on storage.objects for select using (bucket_id = 'prescriptions');

create policy "Prescription Images Allow Upload"
  on storage.objects for insert with check (bucket_id = 'prescriptions');