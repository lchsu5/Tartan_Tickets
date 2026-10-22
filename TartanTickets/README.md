# Tartan Tickets demo

A small Next.js demo for Story 1: browsing upcoming student club events. It
shows each event's date, location, price, and available seats. Sold-out events
offer a typed-name waitlist form. Ticket purchases and sign-in are not enabled.

Live app: https://tartan-tickets-delta.vercel.app

Event listings and waitlist entries are held in server memory only. They reset
when the server restarts and are not shared reliably between separate hosting
instances, so this demo is not suitable for real ticket sales.

## Run locally

1. Install Node.js LTS if it is not already installed.
2. From PowerShell in this folder, run `npm.cmd install`.
3. Run `npm.cmd run dev`.
4. Open <http://localhost:3000>.

## Tests and production build

- `npm.cmd test` runs the Story 1 tests.
- `npm.cmd run build` creates a production build.
- `npm.cmd run start` serves that production build locally.

Verified October 22, 2026: **2 test files, 15 tests passed**, and the production
build completed successfully, including TypeScript checks.

## Assignment and specifications

- [Requirements](docs/requirements.md)
- [Security specification](docs/SECURITY_SPEC.md)
- [Test specification](docs/TEST_SPEC.md)
- [Assignment checklist, assumptions, and browser walkthrough](docs/ASSIGNMENT_CHECKLIST.md)

Only Story 1 is implemented. Buy displays a demo explanation; it does not perform
a simulated checkout. The waitlist accepts names up to 100 characters and is an
extra prototype feature, without duplicate detection or notifications.

## Deploy to Vercel

From this app folder, sign in and deploy with the official CLI:

```powershell
npx.cmd vercel@latest login
npx.cmd vercel@latest --prod
```

Use your existing account and the Next.js defaults. If importing the outer GitHub
repository through Vercel's dashboard, set Root Directory to `TartanTickets`.
No environment variables are required. Do not add payment keys for this demo.
See [Vercel's deployment guide](https://vercel.com/docs/cli/deploying-from-cli).

After deployment, open the production URL, repeat the browser checklist, and save
a screenshot with the URL visible. Also save the security audit table screenshot.

## Security spec audit

Reviewed October 22, 2026 against [docs/SECURITY_SPEC.md](docs/SECURITY_SPEC.md).
No application code was changed as part of this audit. The live homepage and
both API routes were verified to redirect HTTP to HTTPS (308) and return HSTS
(`max-age=63072000; includeSubDomains; preload`) over HTTPS.

This audit compares the current demo with each requirement in the security spec.
“Partly” means a limited aspect is present, but the complete requirement is not.

| Requirement | Status | Why |
|---|---|---|
| SEC-1 | Partly | No passwords are stored, but the app does not authenticate users with CMU SSO. |
| SEC-2 | Not at all | The app does not create or expire user sessions. |
| SEC-3 | Fully (Vercel deployment) | The live homepage and both API routes redirect HTTP to HTTPS and send HSTS via Vercel; local development still uses HTTP. |
| SEC-4 | Not at all | There are no role or club-membership checks; the waitlist endpoint accepts a typed name without sign-in. |
| SEC-5 | Not at all | Club-scoped authorization, access-denied handling for club resources, and attempt logging are not implemented. |
| SEC-6 | Not at all | Tickets and student-owned ticket lookup do not exist. |
| SEC-7 | Partly | The demo accepts no card numbers, but it does not integrate Stripe-hosted Checkout. |
| SEC-8 | Not at all | Checkout and charge calculation are not implemented. |
| SEC-9 | Not at all | There is no Stripe webhook endpoint, signature verification, or webhook logging. |
| SEC-10 | Not at all | Stripe events, ticket issuance, and duplicate-event handling are not implemented. |
| SEC-11 | Partly | No Stripe keys are present, but secrets-manager storage and separate live/test key controls are not implemented. |
| SEC-12 | Not at all | Club Stripe-account changes and the two-approval process are not implemented. |
| SEC-13 | Not at all | Tickets and QR tokens are not implemented. |
| SEC-14 | Not at all | Ticket scanning, atomic check-in, and duplicate-scan handling are not implemented. |
| SEC-15 | Not at all | Ticket scanning, invalid-scan rate limits, and officer notifications are not implemented. |
| SEC-16 | Not at all | Checkout and checkout rate limits are not implemented. |
| SEC-17 | Not at all | Purchases and purchase-record data controls are not implemented; the waitlist stores only a typed name in memory. |
| SEC-18 | Not at all | Event-record anonymization and scheduled data deletion are not implemented. |
| SEC-19 | Not at all | Attendee exports, officer authorization, and export logging are not implemented. |
| SEC-20 | Partly | React renders current event text as text, but officer-entered event names and descriptions are not supported. |
| SEC-21 | Not at all | Sensitive-action audit logging is not implemented. |
| SEC-22 | Not at all | Audit logs, append-only storage, admin-only access, and one-year retention are not implemented. |
