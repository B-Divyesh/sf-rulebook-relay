# Review 2 — Deliver three couriers before 40 moves

## Verdict: PASS

- Findings: **0** at every severity
- Untested public claims: **0**
- Live URL: `https://rulebook-relay.sociobot.in`
- Implementation candidate: `1a28a7985130c2b80d3e66bace716cc2c89e3b33`
- Prior verification documentation: `49a1d0e0fd08b323e7f7c9b098387774bc1dc4e1`
- Later wrapper: `074191eac66e5f733c54fc4c0b75bd0f9a8066a4` (Graphify files only)
- Review date: 6 September 2026 UTC

The live product passes the browser-game, sample, claims, accessibility,
privacy, performance, plain-language, and site-structure contracts. The live
HTML, JavaScript, main CSS, 404 HTML, and 404 CSS match the candidate build.

## Job, audience, and first action

Before scrolling, fresh desktop and 390 × 664 phone browsers state the job as
“Deliver three couriers before 40 moves.” They identify daily-puzzle players
who want a changing logic rule instead of another word grid. The first action
is “Try it with sample data.” The next line says that the sample opens partway
through a verified route.

The game itself is visible on the first screen. The board starts at 437 px in
the 1366 × 900 desktop viewport. It starts at 571.02 px on the phone home page
and 586.91 px on the phone sample page, both within the 664 px viewport. The
first screens have no console errors or horizontal overflow.

## One-click sample and complete game run

The primary action opened `/demo` in one click. The sample showed the persistent
“Demo — sample data, nothing is saved” label, **Reset demo**, **Start for real**,
a populated relay-order board, and `8 / 40 moves`.

A fresh recorded run used the rendered courier and direction controls for the
remaining ten moves. It reached the focused win dialog, “All three couriers
arrived,” at 18 moves for seed `20260901`. Initial dialog focus was on
**Restart puzzle**. Restart restored `0 / 40 moves`, the original courier
positions, and removed the dialog. A separate fresh live run reached the real
loss dialog on the 40th accepted move.

Reset returned the sample to move 8 and kept planted `rr:real:` data unchanged.
**Start for real** removed planted `rr:demo:` data, kept the real value, and
opened the daily puzzle. The run trace and checked end screen are in
`.factory/evidence/review-2/`.

## Normal, invalid, boundary, and recovery paths

- A wrong courier selection in relay order kept the count at `8 / 40 moves`
  and announced “Gold must move next.”
- Keyboard selection and an arrow key made move 9 and kept focus on the board.
- A real touch tap made move 9; a real touch swipe made move 10.
- Pause and resume kept the same run. Undo, reload persistence, and malformed
  storage recovery passed in the live browser suite.
- Win at 18 moves and loss at 40 moves both produced complete end screens.
- Sound and reduced-motion settings stayed set after reload.
- Canceling deletion kept daily and sample values. Confirming deletion removed
  daily progress, announced the result, and kept sample data unchanged.
- Browser back and forward restored the route URL, title, and focused `h1`.

## Claims and clean checkout

A fresh clone checked out the implementation candidate directly. `npm ci`
installed 59 packages and reported zero vulnerabilities. Each claim tag occurs
exactly once in the unit or browser test source.

Every exact command in `.factory/claims.json` passed separately:

| Declared claim | Result |
| --- | --- |
| `daily-solvable` | PASS — 42 dates had solver routes of 18–32 moves |
| `seed-repeat` | PASS — the same UTC date reproduced the puzzle |
| `rule-cycle` | PASS — all six rules and their movement effects were checked |
| `complete-run` | PASS — visible controls reached the win screen |
| `restart-reset` | PASS — positions and the move count returned to the start |
| `loss-screen` | PASS — accepted move 40 produced the loss screen |
| `input-controls` | PASS — keyboard, swipe, and direction controls moved |
| `settings-persist` | PASS — sound and motion choices survived reload |
| `demo-isolation` | PASS — sample reset kept real progress unchanged |
| `local-only` | PASS — requests stayed same-origin and progress stayed local |
| `offline-reload` | PASS — a dedicated context reloaded and worked offline |
| `frame-rate` | PASS — the throttled mobile board loop stayed above 50 fps |

`npm test` passed 9 unit tests and 16 browser tests. `npm run build` passed and
created `dist/`. Initial JavaScript is 30.55 KB raw / 10.47 KB gzip. Initial
CSS is 16.21 KB raw / 4.48 KB gzip.

A cross-check of the rendered home, sample, settings, privacy, terms, and 404
pages, plus the README and manifest, found no missing, false, incomplete, or
untested public claim.

## Accessibility, privacy, offline use, and performance

The fresh live 16-test browser suite passed. The separate Axe CLI scan found
zero violations on `/`, `/demo`, `/settings`, `/privacy`, `/terms`, and a
missing route. The URL verifier found `lang="en"`, one `h1`, one `main`, no
missing image alternatives, no unnamed buttons, and no console errors.

The skip link is the first keyboard target; activating it makes the next Tab
land on the sample action inside `main`. All visible phone links and buttons
measure at least 44 × 44 CSS px. Dialog focus, route focus, reduced motion, and
200% text passed. The legal pages have distinct titles and working deletion and
contact paths.

Sample-play network recording observed same-origin GET requests only. The
product has no account, analytics, advertising, payment flow, third-party
runtime script, or runtime AI. Daily and sample state use separate localStorage
prefixes. A dedicated fresh context installed the service worker, went offline,
reloaded `/demo`, and operated the rule example. No update behavior is promised.

The live 390 × 844 board loop measured 60 fps over 120 frames with four-times
CPU slowdown. Three fresh mobile Lighthouse runs scored 96, 95, and 96 for
performance, for a median of 96. Accessibility, best practices, and SEO scored
100 in every run. LCP was 1.20–1.23 s and CLS was 0.

## Routes, links, metadata, and candidate identity

`/`, `/demo`, `/settings`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`,
and the manifest returned HTTP 200. Rendered internal links and the external
Param Factory link were reachable. Privacy and support addresses are explicit
`mailto:` links. HTTP redirects to HTTPS.

The unknown review route deliberately returned HTTP 404 with the designed
recovery page. It has the shared navigation, Privacy and Terms links, factory
attribution, generated-art note, version, and a path home. This expected 404 is
not a defect.

The root response includes CSP, HSTS, referrer, content-type, frame, and
permissions headers. Byte comparisons matched the live root HTML, hashed
JavaScript, hashed CSS, 404 HTML, and 404 CSS to the clean candidate build.
Commits after `1a28a79` contain reports, evidence, and Graphify output only, so
they do not require another product image.

This is a static one-player game with no backend. Tenant isolation, SQLite
restart persistence, health, 429/Retry-After, multiplayer clients, and room
persistence do not apply. AI would not improve the brief’s authored daily-rule
game loop, so its absence is not missed product leverage.

## Earlier finding disposition

| Earlier finding | Current proof | Disposition |
| --- | --- | --- |
| Service-worker cache matching failed | Dedicated live offline reload passed | Fixed |
| Board used invalid ARIA ownership | Axe CLI found zero violations on all six routes | Fixed |
| Board fell below a 390 × 664 first screen | Board tops are 571.02 and 586.91 px | Fixed |
| 200% text caused horizontal overflow | Live enlarged-text regression passed | Fixed |
| Unknown routes returned the wrong status | Designed recovery page returned HTTP 404 | Fixed |
| README made an untested 3–8 minute promise | Promise is removed; the 18–32 move claim passed | Fixed |
| Six-day rule sequence lacked a claim test | `rule-cycle` passed exact order and effects | Fixed |
| Mobile navigation targets were below 44 px | Every rendered live route target passed measurement | Fixed |
| Static 404 omitted shared site content | Navigation, attribution, version, and recovery link passed | Fixed |

No earlier major, minor, or low-severity item remains open.

## Evidence

- `.factory/evidence/review-2/complete-run-trace.zip`
- `.factory/evidence/review-2/win-end-screen.png`
- `.factory/evidence/review-2/desktop-first-screen.png`
- `.factory/evidence/review-2/desktop-sample.png`
- `.factory/evidence/review-2/phone-first-screen.png`
- `.factory/evidence/review-2/phone-sample.png`
- `.factory/evidence/review-2/phone-404.png`
- `.factory/evidence/review-2/fresh-browsers.json`
- `.factory/evidence/review-2/keyboard-and-focus.json`
- `.factory/evidence/review-2/keyboard-addendum.json`
- `.factory/evidence/review-2/real-touch.json`
- `.factory/evidence/review-2/recovery.json`
- `.factory/evidence/review-2/data-deletion.json`
- `.factory/evidence/review-2/404.json`
- `.factory/evidence/review-2/axe-live.json`
- `.factory/evidence/review-2/lighthouse-live-1.json`
- `.factory/evidence/review-2/lighthouse-live-2.json`
- `.factory/evidence/review-2/lighthouse-live-3.json`
- `.factory/evidence/review-2/url-check/verify.json`

The unambiguous product verdict is **PASS** with zero findings and zero
untested claims.
