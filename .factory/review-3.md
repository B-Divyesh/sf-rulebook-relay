# Review 3 — Deliver three couriers before 40 moves

## Verdict: PASS

- Findings: **0** at every severity
- Untested public claims: **0**
- Live URL: `https://rulebook-relay.sociobot.in`
- Implementation candidate: `1a28a7985130c2b80d3e66bace716cc2c89e3b33`
- Documentation baseline: `4a75bdd942a364da43eb2c55897df813ef85df48`
- Review date: 6 September 2026 UTC

The live game passes the browser-game, sample, claims, accessibility, privacy,
performance, plain-language, and site-structure contracts. Later commits after
the implementation candidate contain documentation, review evidence, and
Graphify output only. Fresh SHA-256 comparisons match the live HTML, JavaScript,
CSS, service worker, manifest, static 404 HTML, and 404 CSS to the candidate.

## Job, audience, and first action

Before scrolling, fresh desktop and 390 × 664 phone browsers state the job as
“Deliver three couriers before 40 moves.” They identify daily-puzzle players
who want a changing logic rule instead of another word grid. The first action
is “Try it with sample data.” The adjacent sentence says the sample opens
partway through a verified route.

The game itself is visible on the first screen. The board begins at 437 px in
the 1366 × 900 desktop viewport and 571.02 px in the phone viewport. The sample
board begins at 586.91 px on the same phone. Both phone pages show at least 64
px of the playable board before scrolling. Neither page has horizontal
overflow.

## Sample, complete run, and reset

The first action opened `/demo` in one touch. The populated screen showed the
persistent “Demo — sample data, nothing is saved” label, **Reset demo**,
**Start for real**, seed `20260901`, the relay-order rule, and `8 / 40 moves`.

A fresh traced run used only rendered courier and direction controls for the
remaining ten moves. It reached the focused win dialog “All three couriers
arrived” at 18 moves. The dialog named the seed, move count, and rule. Initial
focus was on **Restart puzzle**. Restart restored `0 / 40 moves` and the
starting courier positions. A separate fresh live browser run reached “This
route ran out of moves” on the 40th accepted move.

Reset restored the sample to move 8 and kept planted `rr:real:` data unchanged.
**Start for real** deleted all planted `rr:demo:` keys, kept real data, and
opened the daily puzzle. The trace and checked end-screen image are under
`.factory/evidence/review-3/`.

## Controls, boundaries, and recovery

- Selecting Coral when Gold was required kept the count at 8 and announced
  “Gold must move next.”
- Keyboard number and arrow input made an accepted move and retained board
  focus. The skip link was the first Tab target.
- A real phone touch made move 9. A real Chromium touch swipe made move 10.
- Pause blocked input at move 8. Resume accepted the same input and reached
  move 9.
- Move 9 survived reload. Undo returned to move 8, which also survived reload.
- Malformed saved state recovered to a playable board with a clear message.
- Sound and reduced-motion settings survived reload in isolated sample storage.
- Canceling deletion kept data. Confirming deletion removed only daily keys,
  announced the result, and retained sample keys.
- Client-side navigation, browser Back, and route changes restored the correct
  URL, title, and focused `h1` without a keyboard trap.

The six advertised daily rule modes and their movement effects passed the
deterministic unit claim. The daily seed is visible on screen. No multiplayer,
gamepad, archive, payment, or online room mode is advertised.

## Clean checkout and claims

A fresh clone checked out the implementation candidate directly. `npm ci`
installed 59 packages and reported zero vulnerabilities. Each claim tag occurs
exactly once in the intended unit or browser test.

Every exact command in `.factory/claims.json` passed separately:

| Declared claim | Result |
| --- | --- |
| `daily-solvable` | PASS — 42 dates had verified 18–32 move routes below 40 |
| `seed-repeat` | PASS — the same UTC date reproduced the complete puzzle |
| `rule-cycle` | PASS — all six rules and their movement effects were checked |
| `complete-run` | PASS — visible controls reached the real win screen |
| `restart-reset` | PASS — positions and move count returned to the start |
| `loss-screen` | PASS — accepted move 40 produced the loss screen |
| `input-controls` | PASS — keyboard, swipe, and direction controls moved |
| `settings-persist` | PASS — sound and motion choices survived reload |
| `demo-isolation` | PASS — sample play and reset preserved daily data |
| `local-only` | PASS — sample requests stayed same-origin and state stayed local |
| `offline-reload` | PASS — a dedicated context reloaded and worked offline |
| `frame-rate` | PASS — the throttled mobile loop stayed above 50 fps |

`npm test` passed 9 unit tests and 16 Playwright tests. `npm run build` passed
and created `dist/`. Initial JavaScript is 30.55 KB raw / 10.47 KB gzip.
Initial CSS is 16.21 KB raw / 4.48 KB gzip.

A fresh cross-check covered the rendered landing page, game, settings,
privacy, terms, 404, manifest, README, and handoff. Every visitor-facing
promise has a declared outcome test. No claim is missing, false, incomplete,
or untested.

## Accessibility, privacy, offline use, and performance

The complete 16-test suite passed again against live HTTPS. A separate full
Axe scan found zero violations of any severity on `/`, `/demo`, `/settings`,
`/privacy`, `/terms`, and a missing route. The URL verifier found `lang="en"`,
one `h1`, one `main`, no missing image alternatives, no unnamed buttons, and
no console errors.

All visible phone links and buttons measure at least 44 × 44 CSS px. Focus is
visible, the skip link works, dialogs move focus, route changes focus the new
heading, and no keyboard trap appeared. At 200% text, the board and controls
remain usable with zero horizontal overflow. Under reduced motion, the rule
example transition is effectively zero seconds. The visual thesis deliberately
uses one painted light treatment, so there is no incomplete second theme.

The whole sample run made same-origin GET requests only. The product has no
account, analytics, advertising, payment, third-party script, runtime AI, or
backend. Real and sample progress use separate local storage prefixes. The
Privacy page explains stored fields, deletion, and the privacy email route.
The Terms page covers free use, availability, and the support email route.

A dedicated fresh context installed the service worker, went offline, reloaded
`/demo`, and operated the rule example. Offline reload is the only public
service-worker behavior promised. The source also contains an update-ready
notice, but no update timing claim is advertised.

The live 390 × 844 board loop measured 60.00 fps over 120 frames with four-times
CPU slowdown. Three fresh mobile Lighthouse runs scored 90, 94, and 95 for
performance; the median is 94. Accessibility, best practices, and SEO scored
100 in every run. LCP was 1.20–1.24 seconds and CLS was 0.

## Routes, links, security, and candidate identity

`/`, `/demo`, `/settings`, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml`,
and the manifest returned HTTP 200. Internal page and hash links work. The
external Param Factory link returned 200. Privacy and support addresses are
explicit `mailto:` links. Plain HTTP redirects to HTTPS.

`/missing-review-3` deliberately returned HTTP 404 with the designed recovery
page. It has the shared navigation, Privacy and Terms links, Param Factory
attribution, original-art note, version, and a working route home. This
expected 404 is not a finding.

The root response includes CSP, HSTS, referrer, content-type, frame, and
permissions headers. The product is static and one-player. Backend tenant
isolation, SQLite restart persistence, health, 429/Retry-After, independent
multiplayer clients, and room persistence do not apply. AI would not improve
the brief's authored daily-rule loop, so its absence is not missed leverage.

The correct independent-verification-3 documentation SHA is
`49a1d0e7d8ca88cf30a27c3f5f8e8788f50e232b`; an older handoff line omitted
the `7` after the abbreviated prefix. This report and the handoff record the
correct value. The typo was report metadata, not a product defect.

## Earlier finding disposition

| Earlier finding | Current proof | Disposition |
| --- | --- | --- |
| Service-worker cache matching failed | Dedicated live offline reload operated the sample | Fixed |
| Board used invalid ARIA ownership | Full Axe scans found zero violations on all six routes | Fixed |
| Board fell below a 390 × 664 first screen | Board tops are 571.02 px and 586.91 px | Fixed |
| 200% text caused horizontal overflow | Enlarged text kept controls visible with zero overflow | Fixed |
| Unknown routes returned the wrong status | Designed missing page returned HTTP 404 | Fixed |
| README made an untested 3–8 minute promise | Promise remains removed; the 18–32 move claim passed | Fixed |
| Six-day rule sequence lacked a claim test | `rule-cycle` passed exact order and effects | Fixed |
| Mobile navigation targets were below 44 px | Every visible phone link and button passed measurement | Fixed |
| Static 404 omitted shared site content | Navigation, legal links, attribution, version, and home path passed | Fixed |

No earlier high, medium, low, or minor item remains open. The brief's return
rate target still requires an explicit opt-in study because this privacy-first
game has no analytics or identity. The product does not promise that metric,
so this is not an untested public claim.

## Evidence

- `.factory/evidence/review-3/complete-run-trace.zip`
- `.factory/evidence/review-3/win-end-screen.png`
- `.factory/evidence/review-3/desktop-first-screen.png`
- `.factory/evidence/review-3/desktop-sample.png`
- `.factory/evidence/review-3/phone-first-screen.png`
- `.factory/evidence/review-3/phone-sample.png`
- `.factory/evidence/review-3/designed-404.png`
- `.factory/evidence/review-3/live-review.json`
- `.factory/evidence/review-3/recovery.json`
- `.factory/evidence/review-3/frame-rate.json`
- `.factory/evidence/review-3/candidate-match.json`
- `.factory/evidence/review-3/lighthouse-1.json`
- `.factory/evidence/review-3/lighthouse-2.json`
- `.factory/evidence/review-3/lighthouse-3.json`
- `.factory/evidence/review-3/url-check/verify.json`

The unambiguous product verdict is **PASS** with zero findings and zero
untested claims.
