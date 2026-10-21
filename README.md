# Crescent Expense Management

Dedicated site-expense advance, claim and settlement application for Crescent Contractors.

## Implemented
- Next.js App Router with responsive employee mobile and management desktop layouts.
- Supabase SSR email/password authentication and session refresh.
- Role-aware live dashboard.
- Employee expense submission with mandatory receipt upload to private Storage.
- Database RPCs for claim submission, PM approval/rejection, Accounts verification/return, and advance issue/top-up/cash return.
- Claims queue with role-specific PM and Accounts actions.
- Consolidated employee advance ledger and transaction history.
- Admin workspace for project creation, expense categories, user invitations and project assignment.
- Deployed Supabase Edge Function admin-provision-user (JWT required) to invite Auth users and create role/project profiles.
- PWA manifest and service worker.
- 13 public tables with RLS enabled. Security advisor findings are limited to intentional SECURITY DEFINER RPC warnings; these functions perform server-side role, ownership, project and workflow checks.

## Supabase project
Project ref: ngpodjrdznojmmbwfzmi (Mumbai). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable/anon key only) in Vercel. Never expose a service-role key or commit credentials.

### First administrator bootstrap
1. Create the first administrator's Auth user in Supabase Dashboard → Authentication → Users.
2. Open Supabase SQL Editor and run supabase/bootstrap-first-admin.sql after replacing its email placeholder.
3. Sign in to the portal with that account. The Admin workspace can then invite users and create projects.

## Not yet production-ready
- Server-enforced single-device registration/reset and trusted device/session validation. Browser fingerprint alone is not strong authentication; the device table is not yet an enforcement mechanism.
- Full edit/deactivate/reset workflows for employees and project membership.
- Full project-wise and category-wise reporting, downloadable Excel/PDF exports, and audit review screens.
- Automated negative authorization tests for cross-employee/project access, file access and ledger reconciliation.
- Build/CI verification, Vercel deployment, production environment configuration and domain mapping.
- Configure Auth email/redirect URLs and test invitation/password recovery.

## Ledger rules
Each employee has one consolidated advance balance. Issue and top-up transactions remain separately auditable. Employees pay site vendors themselves from advances; the system records but does not initiate bank/UPI transfers. Every claim requires receipt proof. PM approves/rejects first; Accounts verifies second. Admin does not bypass approvals. Available balance = issued less submitted expenses. Unsettled balance = issued less verified expenses and cash returns.

## Local development
Run npm install, copy .env.example to .env.local, set the Supabase publishable key, then npm run dev.
