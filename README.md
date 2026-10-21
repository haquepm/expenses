# Crescent Expense Management

A dedicated employee site-expense advance, claim and settlement workspace for Crescent Contractors.

## Current state

The first UI/PWA scaffold is committed to `main`:
- `index.html` — responsive management dashboard and employee mobile preview
- `manifest.webmanifest` — installable web app metadata
- `sw.js` — basic offline shell cache

The interface intentionally displays placeholders rather than fabricated financial data. It is a UI preview only; authentication, database writes, approvals, receipt uploads and live reports are not yet enabled.

## Confirmed operating rules

- Employees use their own login and the mobile app; one registered phone per employee account. Admin can reset device binding.
- Project Managers, Accounts, Admin and Management use the desktop portal.
- Each employee has one consolidated open advance balance. Each issue/top-up remains a separate auditable transaction.
- Additional advances add to the existing consolidated balance, even when a balance remains outstanding.
- Expenses are paid by employees from company advances; the system records transactions but does not initiate bank/UPI payments.
- Every expense requires receipt/proof.
- Approval sequence: Project Manager approval, then Accounts verification.
- Track available balance (issued less submitted expenses) separately from unsettled balance (issued less verified expenses and recorded returns).
- Admin manages users/access but does not approve expenses automatically.

## Backend connection blocker

The supplied Supabase project ref is `ngpodjrdznojmmbwfzmi`. It is not visible in any of the currently connected Supabase accounts, and the connected Supabase tool returns permission denied when asked to inspect it. No schema, Auth, Storage or project settings have been changed.

To continue backend integration, reconnect/authorize the Supabase account that owns this project in the Supabase integration. Do not use or modify the Subcontractor Billing, Asset Management, Little Basket or Quotation Repository databases.

## Planned production architecture

- Next.js app with desktop management routes and mobile-first employee PWA.
- Supabase Auth with server-verified sessions.
- Role and project access stored in database-controlled records, not user-editable metadata.
- RLS on every exposed table.
- Private receipt bucket with user/project-scoped policies.
- Server-side privileged operations only; never expose service-role or secret keys in browser code.
- Append-only audit trail and controlled reversal/amendment for verified financial records.
- Single-device binding enforced server-side; device reset is an audited admin action.

## Local setup

Backend credentials are deliberately not included. Once the project is authorized, add the project URL and publishable key to deployment environment variables. Do not commit secrets.