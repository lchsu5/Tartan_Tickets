# Part B: Story 3 — Buy tickets

## Agreed scope and planning decisions

The user chose simulated ticket buying after reviewing feature options and
approved the plan before implementation. See **Scope for HW3** at the bottom of
[requirements.md](requirements.md). Next.js, React, and the existing Vitest runner
were retained. `qrcode` generates receipt images locally on the server.

Planning assumption recorded for Part E: the spec asks for emailed receipts,
but today's prototype substitutes an immediate on-screen simulated receipt with
QR codes. The user explicitly approved this adaptation. Real email remains unmet.

## Tests first: actual runs

1. Wrote 18 server tests before adding the checkout implementation. The first
   run failed because the new endpoint did not exist:

   ```text
   Test Files  1 failed | 2 passed (3)
        Tests  18 failed | 15 passed (33)
   ```

   Full original output: [story-3-failing.txt](evidence/story-3-failing.txt).
2. Added a 501 placeholder endpoint and two checkout UI tests. Updated the old
   Story 1 test that asserted purchasing was unavailable to assert the newly
   agreed simulation UI instead. No acceptance checks were skipped or removed
   to make implementation pass. Ran again before implementing the feature;
   failures now include actual assertions such as `expected 501 to be 409`.
   Output: [story-3-failing-assertions.txt](evidence/story-3-failing-assertions.txt).
3. Implemented checkout and ran all tests:

   ```text
   Test Files  4 passed (4)
        Tests  35 passed (35)
   ```

   Production build compiled successfully and completed TypeScript and page
   generation. See the saved test and build logs in `docs/evidence/`.

## Acceptance criterion → test

| Acceptance criterion (homework scope) | Test name | Passing |
|---|---|---|
| Cap each order at four whole tickets | `rejects invalid quantity %s on the server`; `accepts four tickets and ignores a tampered browser price` | Yes |
| Hold seats for ten minutes | `holds seats until exactly ten minutes and then releases them`; `rejects payment at expiry without issuing tickets` | Yes |
| Show immediate simulated receipt with QR codes (email deferred) | `produces an immediate simulated receipt with distinct QR tokens and does not double-charge`; `reserves seats, displays the server total, and shows a simulated receipt after payment` | Yes for agreed adaptation; actual email is not implemented |
| Release seats after decline | `releases declined seats once and refuses later payment` | Yes |
| Offer waitlist if checkout finds no seats | `offers the waitlist when checkout finds the event sold out`; `offers the waitlist when another buyer takes the last seats` | Yes |
| Prevent overselling within one server instance | `allows only one of fifty simultaneous reservations for the last seat` | Yes; cross-instance protection is not implemented |

## Exactly what to click

From `TartanTickets/`, run `npm.cmd run dev` and open http://localhost:3000
(or the alternative port printed by Next.js). For production mode use
`npm.cmd run build` followed by `npm.cmd start`.

1. Click **Buy tickets for Autumn Gala (Demo)**.
2. Enter a made-up buyer name and choose **2** tickets.
3. Click **Reserve tickets**. Check the $30.00 total and ten-minute countdown.
4. Click **Simulated payment**. Check the receipt and two QR codes. No real
   payment happens and no email is sent.
5. Click **Start another order** to try **Simulate decline**. Availability should
   return after decline. A completed purchase keeps its seats sold.
6. Try blank names and five tickets: the form blocks them; direct API requests
   are independently validated by the server.
7. Winter Formal is already sold out and offers **Join waitlist** instead.

Holds expire at ten minutes; inventory is reconciled on the next server request.
Repeated payment requests return the same ticket tokens. Keep receipt tokens
and order IDs private: this prototype has no real authentication.

## Browser verification

Automated Chrome checks on the local production server passed for blank buyer
name, five-ticket input, simulated decline, and simulated successful purchase.
The receipt was also checked at 390px width with no horizontal overflow or page
errors. Saved screenshots and JSON record the actual results, URL, and method.
These checks do not claim the student personally performed them.

Live verification will be recorded separately after publication. Use the actual
results when preparing the submission; do not substitute expected results for
observations.
