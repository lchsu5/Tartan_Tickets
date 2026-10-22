# Task 1 verification

Checked October 22, 2026. Current results do not establish the order in which
earlier work happened. Only Story 1 is required for today's build.

| Step | Status | Evidence / remaining work |
|---|---|---|
| 1. App folder | Satisfied in current layout | `TartanTickets/` contains `package.json`, app code, and tests. It is inside the outer Git repository. An originally empty folder cannot be verified retrospectively. |
| 2. Three specs in docs | Satisfied | `docs/requirements.md`, `docs/SECURITY_SPEC.md`, `docs/TEST_SPEC.md`; the provided local starter files were moved without changing their contents. |
| 3. Read and discuss before coding | Cannot verify retrospectively | Current scope and framework are documented below; the original planning conversation and student answers are not in this repository. |
| 4. Tests first, implementation, tests/build | Current checks pass; sequence unverified | 2 test files and 15 tests pass; production build succeeds. No evidence establishes an original failing-test run before implementation. |
| 5. Run and personally try to break it | Partly | Automated checks cover required event fields, sold-out actions, empty list, blank/wrong/overlong input, invalid JSON, missing/available events, and inert markup. Student still needs to inspect the browser and report observations. |
| 6. Deploy to Vercel | Satisfied | https://tartan-tickets-delta.vercel.app is deployed and publicly returns HTTP 200; the events API also returns 200. GitHub is connected with Root Directory set to `TartanTickets`. |
| 7. Security audit without code changes | Satisfied | README has one row for each SEC-1 through SEC-22, reviewed against the current build. No application code was changed during this audit. |
| 8. Two screenshots | Captured; student address-bar capture remains | `docs/evidence/live-vercel.png` captures the deployed page and `security-audit.png` captures the README audit table rendered as HTML. Headless capture omits browser chrome; take an additional screenshot in your own browser with the live URL visible. |

## Scope, framework, and assumptions

- Story 1 shows upcoming events with date, location, price, and remaining seats;
  sold-out events show Join waitlist instead of Buy.
- Next.js supports the UI and server endpoints in one project and can deploy to
  Vercel. React renders event text as plain text.
- No sign-in provider, database, real payments, or payment credentials are used.
  A typed name is accepted for the waitlist. Waitlists use server memory and can
  reset on restart or differ across Vercel instances.
- Buy is an explanatory demo button, not a simulated checkout. Checkout belongs
  to Story 3; no purchases, holds, tickets, or receipts are implemented.
- Sample dates are generated relative to server initialization; displayed dates
  use America/New_York. Prices are USD. Remaining seats = capacity minus sold.
- The waitlist name limit is 100 characters. There is no quantity field in
  Story 1, so the four-ticket cap is not applicable to today's UI.
- The waitlist is only an extra demo: duplicate names are accepted and no
  notifications, seat offers, or identity verification are implemented.

## Starter spec inconsistencies

- TEST_SPEC references REQ identifiers absent from requirements.md and contains
  additional requirements beyond its six stories. It is a future test plan,
  not evidence that today's prototype meets all those requirements.
- TEST_SPEC asks for disabled Buy when sold out; Story 1 explicitly asks for
  Join waitlist instead. Today's UI follows Story 1.
- requirements.md says personal data is deleted after one year;
  SECURITY_SPEC says names/emails are removed after 90 days. Neither retention
  policy is implemented in this in-memory prototype; clarify before adding storage.
- SECURITY_SPEC references A1–A12 assumptions that are absent from requirements.md.

## Real verification output

```text
Test Files  2 passed (2)
     Tests  15 passed (15)
✓ Compiled successfully in 306ms
  Finished TypeScript in 2.1s
✓ Generating static pages using 6 workers (3/3) in 845ms
```

The app and `/api/events`, `/api/waitlist` are server-rendered on demand.

## Browser checklist for the student

1. Run `npm.cmd run dev` from `TartanTickets/`, then open http://localhost:3000.
2. Check the three upcoming event cards for date, location, price, and seat count.
3. Click Autumn Gala's Buy button: it explains the demo and takes no payment.
4. Winter Formal has zero seats: check that Join waitlist replaces Buy.
5. Open its form. Try blank and whitespace-only names, then a typed sample name.
   Blank input must not join; a valid name shows a success message.
6. Try to enter more than 100 characters: the input caps it; the API also rejects
   a direct request exceeding that limit. There is no ticket-quantity form yet.
7. Use Tab and Enter to navigate; repeat at a narrow/mobile browser width.
8. Record what you actually saw and any failures; do not claim this personal review
   was completed based solely on automated tests.
