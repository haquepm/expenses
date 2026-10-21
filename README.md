# Crescent Expense Management

Dedicated site-expense advance, claim and settlement application for Crescent Contractors.

## Implemented
- Next.js App Router with responsive employee and desktop layouts.
- Supabase SSR email/password authentication and protected server session refresh.
- Role-aware dashboard reading real employee advance balances and expense claims.
- Employee expense submission with receipt upload to a private Storage bucket.
- Database RPCs for atomic claim submission, PM approve/reject, Accounts verification/return, and advance issue/top-up/cash return.
- Role-scoped claims queue with PM and Accounts decision controls.
- PWA manifest and service worker.
- 13 public tables with RLS enabled; security advisor returned no security findings after initial setup.

## Supabase
Project ref: ngpodjrdznojmmbwfzmi (Mumbai). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable/anon key only) in Vercel. Never expose a service-role key or commit credentials.

## Still required before production
- Server-enforced single-device registration/reset and trusted session validation. Browser fingerprint alone is not strong authentication.
- Admin provisioning UI, project assignment UI, category management, complete advance register/reconciliation, management reports and exports.
- Automated negative authorization tests for cross-employee and cross-project access, file policies, workflow state transitions and ledger balances.
- Production deployment, domain and environment configuration.
- Configure Auth email/redirect URLs and test account recovery.

## Ledger rules
Each employee has one consolidated advance balance. Issue and top-up transactions remain separately auditable. Employees pay site vendors themselves from advances; the system records but does not initiate bank/UPI transfers. Every claim requires receipt proof. PM approves/rejects first, Accounts verifies second. Available balance = issued less submitted expenses. Unsettled balance = issued less verified expenses and cash returns. Admin does not bypass approvals.

## Local development
Run npm install, copy .env.example to .env.local, set the Supabase publishable key, then npm run dev.
