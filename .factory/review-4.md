# Review 4 — Deliver three couriers before 40 moves

## Verdict: PASS

- Findings: **0** at every severity
- Untested public claims: **0**
- Live URL: `https://rulebook-relay.sociobot.in`
- Implementation candidate: `1a28a7985130c2b80d3e66bace716cc2c89e3b33`
- Documentation baseline: `3aae453b2091ddbd7b139a28c9a6da99b5a234b7`
- Review date: 6 September 2026 UTC

The unambiguous product verdict is **PASS**. This review found zero product
findings and zero untested public claims.

## Job, audience, and first action

Before scrolling, fresh desktop (1366 × 900) and phone (390 × 664) browser
contexts showed the job: “Deliver three couriers before 40 moves.” They named
the audience as daily-puzzle players who want a changing logic rule instead of
another word grid. The first action was “Try it with sample data,” with the
nearby explanation that it opens partway through a verified route.

Both screens showed the playable board without scrolling. At scroll position
zero, its top was 437 px on desktop and 571.02 px on phone. The corresponding
sample board began at 499 px and 586.91 px. Fresh screenshots and measurements
are in `.factory/evidence/review-4/fresh-screen-and-demo.json`.

## Sample and game loop

One click opened `/demo`. It showed the persistent “Demo — sample data,
nothing is saved” label, **Reset demo**, **Start for real**, a populated
relay-order board, and `8 / 40 moves`. The rule example produced “Example
complete,” then Reset demo restored `8 / 40 moves` while a planted
`rr:real:review4` value remained `preserve`.

The live visible-control completion test played the deterministic remaining
sample route and reached the real win dialog. It passed in 4.8 seconds with a
fresh trace at `.factory/evidence/review-4/complete-run-trace.zip`; the checked
end-screen assertion is `tests/e2e/game.spec.ts-snapshots/completed-sample-end-screen-chromium-linux.png`.
The full live suite also confirmed Restart puzzle restores the start state and
that a separate accepted-move route reaches the real loss dialog at move 40.

Normal, invalid, boundary, and recovery coverage passed: an out-of-order
relay courier is rejected without changing the move count; keyboard arrows,
visible direction controls, and pointer swipe move the board; pause/resume,
undo, reload persistence, malformed storage recovery, settings persistence,
and daily-data deletion all work. The suite also covers real phone touch,
reduced motion, dialog focus, route focus, and 200% text with no horizontal
overflow.

## Clean checkout and public claims

A fresh detached checkout of the candidate installed with `npm ci` using
Node 22.23.2 and npm 10.9.8; npm reported zero vulnerabilities. Every exact
command declared in `.factory/claims.json` was run independently. All passed:

| Claim | Result |
| --- | --- |
| `daily-solvable` | PASS — 42 seeds have solver routes of 18–32 moves below 40 |
| `seed-repeat` | PASS — the same UTC date recreates the puzzle |
| `rule-cycle` | PASS — all six advertised rules and effects are checked |
| `complete-run` | PASS — visible controls reach the win screen |
| `restart-reset` | PASS — count and positions reset |
| `loss-screen` | PASS — the 40th accepted move shows loss |
| `input-controls` | PASS — keyboard, swipe, and buttons move |
| `settings-persist` | PASS — sound and motion survive reload |
| `demo-isolation` | PASS — sample reset preserves daily data |
| `local-only` | PASS — sample requests are same-origin and state is local |
| `offline-reload` | PASS — a dedicated context reloads and works offline |
| `frame-rate` | PASS — four-times-throttled mobile loop stays at least 50 fps |

Each tag occurs exactly once in its intended test source. `npm test` passed 9
unit tests and 16 browser tests; `npm run build` passed and created `dist/`.
The bundle is 30.55 KB JavaScript raw (10.47 KB gzip) and 16.21 KB CSS raw
(4.48 KB gzip). A rendered-copy and README cross-check found no unlisted,
false, incomplete, or untested visitor-facing claim.

## Live runtime, accessibility, privacy, and routes

The complete 16-test Playwright suite passed against the live HTTPS URL; its
recorded result is `status: passed` with no failed tests. It includes the
complete run, loss, reset, keyboard, pointer swipe, settings, sample
isolation, same-origin requests, offline reload, mobile frame-rate, recovery,
route metadata, Axe, short-phone layout, touch-target, reduced-motion, and
enlarged-text checks.

The accessibility checks cover `/`, `/demo`, `/settings`, `/privacy`,
`/terms`, and a missing route with no serious or critical Axe findings. They
confirm one h1 and main landmark per route, `lang="en"`, named controls,
visible focus, skip-link operation, heading focus after navigation, dialog
focus, 44 px phone targets, and no keyboard trap.

The local-only test records only same-origin GET requests during sample play.
There are no accounts, analytics, advertising, payment, runtime AI, third-party
runtime scripts, or backend. The dedicated offline test installed the service
worker, disconnected, reloaded `/demo`, and operated the rule example. No
update timing is advertised. The 390 × 844 four-times-throttled measurement
meets the published 50 fps minimum.

`/`, `/demo`, `/settings`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`,
and the manifest returned HTTP 200. `/missing-review-4` returned the designed
HTTP 404 page; that deliberate status is expected and the page has recovery,
shared navigation, legal links, attribution, and version text. Route titles,
legal pages, metadata, and links passed in the live suite. The root response
has CSP, HSTS, Referrer-Policy, X-Content-Type-Options, frame protection, and
Permissions-Policy.

This is a static, single-player game. Backend tenant isolation, SQLite restart
persistence, health endpoints, request limits, 429/Retry-After, independent
multiplayer clients, and room persistence do not apply. The authored
daily-rule puzzle does not imply a missing AI feature.

## Candidate identity and earlier findings

The live root HTML, hashed JavaScript, CSS, service worker, manifest, static
404 HTML, and 404 CSS each have the same SHA-256 value as a fresh candidate
build. Commits after `1a28a79` through the documentation baseline contain only
reports, evidence, copy audit, and Graphify output; there is no later product
image to review.

| Earlier finding | Current disposition |
| --- | --- |
| Service-worker cache matching | Fixed — live offline reload passed |
| Invalid board ARIA ownership | Fixed — live Axe coverage passed |
| Board below short phone first screen | Fixed — 571.02/586.91 px board tops |
| 200% text overflow | Fixed — regression passed without overflow |
| Wrong unknown-route status | Fixed — designed response is HTTP 404 |
| Untested 3–8 minute promise | Fixed — removed; measured move claim remains |
| Untested six-day rule cycle | Fixed — `rule-cycle` claim passed |
| Mobile navigation below 44 px | Fixed — live target measurement passed |
| Incomplete static 404 structure | Fixed — shared structure passed |

The brief's return-rate research measure is not a public product promise and
cannot be measured without the analytics this privacy-first product excludes.
It is not an untested claim.

## Evidence

- `.factory/evidence/review-4/fresh-screen-and-demo.json`
- `.factory/evidence/review-4/desktop-home.png`
- `.factory/evidence/review-4/desktop-demo.png`
- `.factory/evidence/review-4/phone-home.png`
- `.factory/evidence/review-4/phone-demo.png`
- `.factory/evidence/review-4/complete-run-trace.zip`
