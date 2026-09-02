# Alem Pharmacy Management System (PMS)

A multi-page, multi-role Next.js (App Router) application demo for a pharmacy's
clinical, retail, and inventory operations, with an in-memory, append-only
audit log architecture.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** with a dark clinical color palette matching the provided
  Stitch mockups (`/mnt/user-data/uploads` reference designs: login, dashboard,
  executive, pharmacist, pos, inventory, security)
- **shadcn/ui**-style components (Button, Card, Dialog, Select, Table, Badge,
  Input, Label, Textarea) built on Radix primitives
- **lucide-react** icons
- **Supabase** — schema + client stub included for when you want real
  persistence (see below); the running demo does not require it

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## How the demo works

There is no real backend. All state (`inventory`, `staffProfiles`,
`prescriptions`, `auditLogs`, `cart`, `currentUser`) lives in a single React
Context + `useReducer` store at `lib/store.tsx`. Every mutating action —
approving a prescription, receiving a shipment, suspending a staff member,
completing a sale — **appends** a new entry to `auditLogs`. Existing entries
are never edited or removed, mirroring an immutable audit log design.

### Routing

| Role | Route |
|---|---|
| Admin | `/admin` |
| Pharmacist | `/pharmacist` |
| Cashier | `/pos` |
| Inventory Clerk | `/inventory` |
| Customer | `/portal` |

`/login` has a role toggle bar for quickly switching between the five demo
identities. Signing in fires a `USER_LOGIN` audit event and routes to the
matching workspace. Each workspace route checks `currentUser.role` and
bounces back to `/login` if it doesn't match — a lightweight client-side
stand-in for real RBAC route guards.

### Audit event catalogue

| Action | `action_type` |
|---|---|
| Sign in | `USER_LOGIN` |
| Add staff member | `STAFF_REGISTERED` |
| Change role | `ROLE_CHANGED` |
| Suspend / activate account | `ACCOUNT_SUSPENDED` / `ACCOUNT_ACTIVATED` |
| Export audit logs | `AUDIT_LOG_EXPORTED` |
| Verify prescription | `PRESCRIPTION_VERIFIED` |
| Reject prescription | `PRESCRIPTION_REJECTED` |
| Quarantine batch | `BATCH_QUARANTINED` |
| Complete POS sale | `POS_TRANSACTION_COMPLETED` |
| Receive shipment | `SHIPMENT_RECEIVED` |
| Dispose expired stock | `STOCK_DISPOSED` |

Every entry carries `timestamp`, `action_type`, `user_id`, `user_role`, and a
human-readable `payload_delta`, exactly as specified.

## Moving to real persistence

`supabase/schema.sql` defines the production table shapes (`profiles`,
`stock_batches`, `prescriptions`, `audit_logs`) with row-level security
policies enforcing role-based access, plus an `audit_logs` table that has no
`UPDATE`/`DELETE` policy for any role — RLS default-denies both, making the
log immutable at the database layer. `lib/supabase/client.ts` is a ready-to-use
browser client stub (reads `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`) that isn't wired into the store yet — swap the
reducer's in-memory updates for Supabase calls when you're ready.

## Project structure

```
app/
  login/page.tsx        Master login + role switcher
  admin/page.tsx         System Admin Dashboard
  pharmacist/page.tsx    Pharmacist Workstation
  pos/page.tsx           Cashier Point of Sale
  inventory/page.tsx     Stock & Batch Control
  portal/page.tsx        Customer self-service portal
components/
  ui/                    shadcn-style primitives
  layout/AppShell.tsx    Sidebar shell + role guard, shared by every workspace
  audit/AuditLogPanel.tsx
  admin/ pharmacist/ pos/ inventory/   Feature-specific widgets & modals
lib/
  store.tsx              Global state + reducer + audit logging
  types.ts, mock-data.ts, csv.ts, utils.ts
  supabase/client.ts
supabase/schema.sql
```
