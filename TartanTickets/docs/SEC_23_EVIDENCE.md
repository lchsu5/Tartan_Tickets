# Part C: SEC-23 — checkout request-size limit

## Requirement and scope

SEC-23 was added to [SECURITY_SPEC.md](SECURITY_SPEC.md) before implementation.
POST `/api/orders` must reject a body over 16,384 bytes (16 KiB) with HTTP 413
before parsing JSON or changing order/inventory state. The limit applies to
actual streamed bytes, even with no Content-Length or a falsely small value.
Reading stops when the limit is exceeded; an exactly-limit request proceeds to
normal validation. No authentication, database, or payment provider was added.

## Before and after audit rows

| Version | Requirement | Status | Why |
|---|---|---|---|
| Before | SEC-23 | Not at all | Checkout parses the entire JSON body without a request-size limit; oversized bodies can reach parsing and reservation logic. |
| After | SEC-23 | Fully | POST /api/orders rejects declared or streamed bodies over 16,384 bytes with HTTP 413 before JSON parsing or state changes, cancels further reading, and accepts exactly-limit bodies for normal validation. Other routes and general denial-of-service protection are outside this rule. |

## Actual tests-first evidence

The requirement and seven tests were written before the request reader changed.
The original failing run reported:

```text
Test Files  1 failed | 4 passed (5)
     Tests  6 failed | 36 passed (42)
AssertionError: expected 201 to be 413
```

Six tests exposed missing enforcement. One boundary test already passed because
the original implementation accepted a valid body exactly at the limit; that is
an intentional compatibility check, not evidence that protection already existed.

After implementing the streaming reader, the final run reported:

```text
Test Files  5 passed (5)
     Tests  42 passed (42)
```

The production build also passed compilation, TypeScript, and page generation.
Full logs and screenshots are in `docs/evidence/sec-23-*`.

| Test (plain-English sentence) | Passing |
|---|---|
| rejects an oversized checkout request before it can reserve any seats | Yes |
| rejects oversized bodies when the content length header is absent | Yes |
| rejects oversized bodies even when the browser claims they are small | Yes |
| accepts a valid checkout body exactly at the byte limit | Yes |
| counts UTF-8 bytes instead of characters | Yes |
| cancels a streamed body as soon as its byte count exceeds the limit | Yes |
| rejects a declared oversized body without reading its stream | Yes |

## C-why — explanation to review for the submission

A visitor can bypass the page and send a request directly to the checkout API,
so browser limits cannot protect the server. The server must count incoming bytes
and reject excess data before parsing or changing reservations; an instruction to
a model does not enforce that rule on HTTP requests.

## Limits

This rule protects the application-level checkout body reader. It does not add
rate limits, request timeouts, authentication, limits for other endpoints, or
protection against every denial-of-service attack. Hosting infrastructure may
buffer request data before the application receives it. Those broader safeguards
remain separate work.
