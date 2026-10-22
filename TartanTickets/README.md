# Tartan Tickets demo

A Next.js prototype for Story 1 (browse events) and Story 3 (simulated ticket
buying). Event cards show date, location, price, and available seats. Sold-out
events offer a typed-name waitlist form. Checkout reserves 1–4 tickets for ten
minutes, then allows simulated payment or decline. Successful simulation shows
an on-screen receipt with one QR code per ticket.

Live app: https://tartan-tickets-delta.vercel.app

Original URL (also updated and verified): https://tartantickets.vercel.app

Events, reservations, receipts, and waitlist entries are held in server memory
only. They reset on every deploy/restart and are not shared between hosting
instances. Atomic reservations are proven only within one server instance; this
demo is not suitable for real ticket sales. A typed name is not authenticated.

**Non-goals:** real payments, real authentication, databases, receipt emails,
ticket scanning, and durable/cross-instance inventory. No money is charged or
email sent. The homework scope substitutes an immediate on-screen receipt for
Story 3's emailed receipt. QR codes contain random tokens, not personal data.

## Run locally

1. Install Node.js LTS if it is not already installed.
2. From PowerShell in this folder, run `npm.cmd install`.
3. Run `npm.cmd run dev`.
4. Open <http://localhost:3000>.

## Tests and production build

- `npm.cmd test` runs the Story 1 and Story 3 tests.
- `npm.cmd run build` creates a production build.
- `npm.cmd run start` serves that production build locally.

Verified October 22, 2026: **4 test files, 35 tests passed**, and the production
build completed successfully, including TypeScript checks.

## Assignment and specifications

- [Requirements](docs/requirements.md)
- [Security specification](docs/SECURITY_SPEC.md)
- [Test specification](docs/TEST_SPEC.md)
- [Assignment checklist, assumptions, and browser walkthrough](docs/ASSIGNMENT_CHECKLIST.md)

The waitlist accepts names up to 100 characters and is an extra prototype
feature, without duplicate detection or notifications. Stories 2, 4, 5, and 6
are not implemented. See [Story 3 evidence and walkthrough](docs/STORY_3_EVIDENCE.md).

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
The original audit was documentation-only. Rows below have been reviewed again
after Story 3 implementation. The original live homepage and API routes were
verified to redirect HTTP to HTTPS (308) and return HSTS
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
| SEC-6 | Not at all | Simulated tickets exist, but typed names do not establish ownership; an opaque order ID acts as a bearer secret, not student authorization. |
| SEC-7 | Partly | The demo accepts no card numbers, but it does not integrate Stripe-hosted Checkout. |
| SEC-8 | Partly | Simulated totals are computed on the server from stored price and quantity; tampered browser totals are ignored and tested. Real charges are not implemented. |
| SEC-9 | Not at all | There is no Stripe webhook endpoint, signature verification, or webhook logging. |
| SEC-10 | Not at all | Stripe events, ticket issuance, and duplicate-event handling are not implemented. |
| SEC-11 | Partly | No Stripe keys are present, but secrets-manager storage and separate live/test key controls are not implemented. |
| SEC-12 | Not at all | Club Stripe-account changes and the two-approval process are not implemented. |
| SEC-13 | Partly | Each simulated ticket gets a cryptographically random 128-bit token with no PII, stored on the server; scanner-side lookup is not implemented. |
| SEC-14 | Not at all | Ticket scanning, atomic check-in, and duplicate-scan handling are not implemented. |
| SEC-15 | Not at all | Ticket scanning, invalid-scan rate limits, and officer notifications are not implemented. |
| SEC-16 | Not at all | Checkout exists, but there is no per-account checkout rate limit or 30-minute block. |
| SEC-17 | Partly | Simulated orders collect a typed name without card data; Andrew email and Stripe payment IDs are absent and the full purchase schema is not implemented. |
| SEC-18 | Not at all | Event-record anonymization and scheduled data deletion are not implemented. |
| SEC-19 | Not at all | Attendee exports, officer authorization, and export logging are not implemented. |
| SEC-20 | Partly | React renders current event text as text, but officer-entered event names and descriptions are not supported. |
| SEC-21 | Not at all | Sensitive-action audit logging is not implemented. |
| SEC-22 | Not at all | Audit logs, append-only storage, admin-only access, and one-year retention are not implemented. |
