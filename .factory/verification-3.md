# Verification 3 — Deliver three couriers before 40 moves

## Verdict: PASS

- Findings: **0** at every severity
- Untested public claims: **0**
- Live URL: `https://rulebook-relay.sociobot.in`
- Implementation candidate: `1a28a7985130c2b80d3e66bace716cc2c89e3b33`
- Repair documentation: `40afbc0393d0d5da037682d187ce5b22d6a8c4e4`
- Later wrapper: `80f28057655e07ccacb56b6373d139ffcb1bbc70` (Graphify files only)
- Verification date: 5 September 2026 UTC

The implementation passes the browser-game, demo, claims, accessibility,
privacy, performance, plain-language, and site-structure contracts. The live
HTML, JavaScript, main CSS, 404 HTML, and 404 CSS match the candidate build
byte for byte.

## Job, audience, and first action

Before scrolling, fresh desktop and 390 × 664 phone browsers state the job as
“Deliver three couriers before 40 moves.” They identify daily-puzzle players
who want a changing logic rule instead of another word grid. The first action
is “Try it with sample data,” followed by a plain explanation that it opens
partway through a verified route.

The game itself is visible on the first screen. The board starts at 414.67 px
in the 1366 × 900 desktop viewport. It starts at 571.02 px on the phone home
page and 586.91 px on the phone sample page, both within the 664 px viewport.
There is no horizontal overflow.

## Clean checkout and claims

A fresh clone at `/tmp/rulebook-relay-verify3-clean-F4teJi` checked out the
implementation candidate directly. `npm ci` installed 59 packages and
reported zero vulnerabilities.

Every exact command in `.factory/claims.json` passed separately:

| Declared claim | Result |
| --- | --- |
| `daily-solvable` | PASS — 42 dates had solver routes of 18–32 moves |
| `seed-repeat` | PASS — the same date reproduced the full puzzle |
| `rule-cycle` | PASS — all six rules and movement effects were checked |
| `complete-run` | PASS — visible controls reached the win screen |
| `restart-reset` | PASS — positions and count returned to the start |
| `loss-screen` | PASS — the 40th accepted move produced the loss screen |
| `input-controls` | PASS — keyboard, swipe, and direction buttons moved |
| `settings-persist` | PASS — sound and motion survived reload |
| `demo-isolation` | PASS — sample reset preserved real data |
| `local-only` | PASS — sample requests stayed same-origin and state stayed local |
| `offline-reload` | PASS — a dedicated context reloaded and worked offline |
| `frame-rate` | PASS — throttled mobile measurement exceeded 50 fps |

Each claim tag occurs once in its intended unit or browser test. A fresh
cross-check of the landing page, game UI, settings, privacy, terms, README,
and manifest found no missing, false, incomplete, or untested public claim.

`npm test` passed 9 unit tests and 16 browser tests. `npm run build` passed and
created `dist/`. Initial JavaScript is 30.55 KB raw / 10.47 KB gzip. Initial
CSS is 16.21 KB raw / 4.48 KB gzip.

## Sample and completed game run

The root action opened `/demo` in one click. The sample showed the persistent
“Demo — sample data, nothing is saved” label, **Reset demo**, **Start for
real**, a populated relay-order board, and `8 / 40 moves`.

A fresh recorded run used the visible courier and direction controls for the
remaining ten moves. It reached the focused result dialog, “All three
couriers arrived,” at 18 moves for seed `20260901`. **Restart puzzle** then
restored move zero and the original courier positions. A separate live path
reached “This route ran out of moves” on the 40th accepted move.

Reset returned the sample to move 8 and preserved planted `rr:real:` data.
**Start for real** discarded planted `rr:demo:` data, preserved real data,
and opened the daily game. The trace and checked end-screen image are under
`.factory/evidence/verification-3/`.

## Normal, invalid, boundary, and recovery paths

- A wrong courier selection during relay order kept the count at 8 and said
  “Gold must move next.”
- Keyboard selection and an arrow key made a move. Undo returned to move 8,
  and reload retained the restored state.
- Pause blocked play; resume restored the board and keyboard focus.
- The live suite recovered malformed storage to a fresh playable board with
  an explicit message.
- Win at 18 moves and loss at 40 moves both produced real end screens.
- The result dialog moved focus to **Restart puzzle**.
- Sound and reduced-motion choices survived reload in demo storage.
- Canceling data deletion retained progress. Confirming it removed real
  progress and announced the result.
- Browser back and forward restored route titles and focused each route h1.

## Accessibility, privacy, offline use, and performance

The live 16-test suite passed against HTTPS. A supplemental Axe scan found
zero violations on `/`, `/demo`, `/settings`, `/privacy`, `/terms`, and a
missing route. The URL verifier found `lang="en"`, one h1, one main landmark,
no missing image alternatives, no unnamed buttons, and no console errors.

Keyboard access, the skip link, route focus, dialog focus, reduced motion,
200% text, and all visible 390 px links and buttons passed. Every measured
touch target was at least 44 × 44 CSS px. The phone views have no horizontal
overflow.

Sample-play network recording saw same-origin GET requests only. The product
has no account, analytics, advertising, payment flow, third-party runtime
script, or runtime AI. Daily and demo state use separate localStorage
prefixes. Privacy and terms routes are complete, and deletion works as
described.

A dedicated fresh context installed the service worker, went offline,
reloaded `/demo`, and ran the rule example. The throttled 390 × 844 board loop
measured 60.003 fps over 120 frames at four-times CPU slowdown.

Three fresh mobile Lighthouse runs scored 89, 96, and 94 for performance;
the median is 94. Accessibility, best practices, and SEO were 100 in every
run. Median LCP was 0.94 s and CLS was 0. The median passes the performance
budget; the score spread is retained in the evidence rather than hidden.

## Routes, links, metadata, and expected 404

`/`, `/demo`, `/settings`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`,
and the manifest returned 200. Internal links and the Param Factory link were
reachable; privacy and support email links are explicit `mailto:` links.
Routes have distinct plain titles, one h1, the shared header and footer,
canonical and social metadata, and the expected focus behavior.

An unknown route deliberately returned HTTP 404 with the designed recovery
page. It includes the shared navigation, Privacy and Terms links, factory
attribution, original-art note, version, and a path home. This expected 404 is
not a defect.

The live response includes CSP, HSTS, referrer, content-type, frame, and
permissions headers. No backend exists, so tenant isolation, SQLite restart
persistence, health, and 429/Retry-After checks do not apply.

## Earlier finding disposition

| Earlier finding | Current evidence | Disposition |
| --- | --- | --- |
| Service-worker cache matching | Dedicated live offline reload passed | Fixed |
| Invalid board ARIA ownership | Full Axe scans found zero violations | Fixed |
| Board below a 390 × 664 first screen | Board tops are 571.02 and 586.91 px | Fixed |
| 200% text overflow | Live enlarged-text check has zero overflow | Fixed |
| Unknown route returned the wrong status | Designed recovery page returns HTTP 404 | Fixed |
| Untested 3–8 minute promise | Removed; 18–32 moves is declared and passed | Fixed |
| Untested six-day rule cycle | `rule-cycle` passed exact order and effects | Fixed |
| Mobile navigation below 44 × 44 px | All live route targets passed measurement | Fixed |
| Incomplete static 404 structure | Shared navigation, attribution, and version passed | Fixed |

## Evidence

- `.factory/evidence/verification-3/complete-run-trace.zip`
- `.factory/evidence/verification-3/win-end-screen.png`
- `.factory/evidence/verification-3/desktop-first-screen.png`
- `.factory/evidence/verification-3/desktop-sample.png`
- `.factory/evidence/verification-3/phone-first-screen.png`
- `.factory/evidence/verification-3/phone-sample.png`
- `.factory/evidence/verification-3/verify.json`
- `.factory/evidence/verification-3/lighthouse-live.json`
- `.factory/evidence/verification-3/lighthouse-live-2.json`
- `.factory/evidence/verification-3/lighthouse-live-3.json`

The unambiguous product verdict is **PASS** with zero findings and zero
untested claims.
