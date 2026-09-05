# Verification 2 — Deliver three couriers before 40 moves

## Verdict: FAIL

- Findings: 4
- Untested public claims: 2
- Live URL: `https://rulebook-relay.sociobot.in`
- Implementation candidate: `50e991e6c557540b072cc0f19dbf6568e5d6d24f`
- Repair evidence commit: `5c1a8f1b696279ee1b8609ab4b166bb0bb004165`
- Corrected repair record: `c32c51d14b845ba657ea7ad811eff388a5a193df`
- Report-only branch wrapper reviewed: `5bcfea3cc5009ec12fc109762c98dd9ab2906919`
- Verification date: 5 September 2026 UTC

The repaired phone layout passes, and the game works end to end. The release
does not pass the full contract because two public claims lack exact declared
tests, several mobile links are below the required 44 × 44 CSS px target, and
the designed 404 page omits required shared site structure.

## Job, audience, and first action

Before scrolling, fresh desktop and 390 × 664 phone browsers state the job as
“Deliver three couriers before 40 moves.” They identify daily-puzzle players
who want a changing logic rule instead of another word grid. The first action
is “Try it with sample data,” followed by the explanation that the sample
opens partway through a verified route.

The game itself is on the first screen. At 390 × 664, the board starts at
571.02 px on `/` and 586.91 px on `/demo`. At 1366 × 900, it starts at
414.67 px on `/` and 499 px on `/demo`. No tested first screen has horizontal
overflow.

## Findings

### Medium — The 3–8 minute duration claim has no declared test

`README.md` tells players, “Plan for a 3–8 minute run.” This numerical time
claim is absent from `.factory/claims.json`, and none of the 11 declared
commands measures a player session against that range. The claims contract
requires quantitative claims to be declared and measured with a margin.

This is one untested public claim.

### Medium — The advertised six-day rule cycle lacks an exact claim test

`README.md` promises a six-day sequence of tailwind, one-way tiles, ice,
relay order, echo movement, and a wind/one-way remix. No claim entry names
this advertised mode sequence. The `daily-solvable` command generates 42
dates and checks solution lengths, but it does not assert the promised rule
order or a mode-specific outcome for every advertised mode. The unit suite
has individual mechanics checks, but they are not the required tagged claim
and do not independently assert the complete advertised cycle.

This is one untested public claim.

### Medium — Some mobile touch targets are smaller than 44 × 44 px

In a fresh 390 px-wide phone context, the shared app header’s **Demo** link is
40.4 × 44 px on `/`, `/demo`, `/settings`, `/privacy`, and `/terms`. On the
designed 404 page, the wordmark is 108.9 × 18 px; the header **Demo** and
**Privacy** links are 47.5 × 19 px and 57.9 × 19 px; the footer links are also
19 px high; and the skip link is 43 px high. These are below the attached
44 × 44 CSS px touch-target requirement.

The game controls themselves meet the target size. This finding concerns the
site navigation and recovery page.

### Low — The 404 page omits required shared header and footer content

The missing route correctly returns HTTP 404 and shows a designed recovery
page. That expected status is not a defect. Its structure is incomplete:
the header omits the **Settings** link used on every app route, and the footer
omits “Built by Param Factory” and the version/build identifier required on
every route. The 404 header and footer should use the same information
skeleton as the other pages.

## Sample and full game run

The root action opened `/demo` in one click. The first sample screen showed
the persistent “Demo — sample data, nothing is saved” label, **Reset demo**,
**Start for real**, a populated relay-order board, and `8 / 40 moves`.

The deterministic sample was played through visible courier and direction
controls to the real result dialog, “All three couriers arrived.” The result
reported seed `20260901`, 18 moves, and relay order. **Restart puzzle** reset
the count to zero and restored all courier positions. A separate accepted-move
path reached the loss screen at move 40. The run trace and checked end-screen
image are in `.factory/evidence/verification-2/`.

Reset returned the sample to move 8 and preserved a planted `rr:real:` value.
**Start for real** removed the `rr:demo:` value, preserved the `rr:real:`
value, and opened the daily game. Sample play therefore does not change real
progress.

## Normal, invalid, boundary, and recovery checks

- A wrong courier selection in relay order kept the count at `8 / 40` and
  announced “Gold must move next.”
- Keyboard selection and an arrow key made an accepted move, kept focus on the
  board, persisted move 9 across reload, and **Undo last move** returned to
  move 8.
- Pause showed a blocking pause state; resume restored the same run.
- Malformed saved state recovered to a fresh playable board with an explicit
  message.
- The 40th accepted move produced the loss dialog. The solved path produced
  the win dialog, whose initial focus is **Restart puzzle**.
- Canceling the delete confirmation retained real progress. Confirming it
  removed real progress while leaving demo data unchanged. Resetting sample
  settings removed only demo data.
- Browser back and forward restored the correct URL and moved focus to each
  route’s `h1`.

## Claims and clean checkout

A new clone at `/tmp/rulebook-relay-verify2-1rmlkk` checked out report-only
commit `5bcfea3cc5009ec12fc109762c98dd9ab2906919`. There are no product-file
changes between that commit and implementation candidate
`50e991e6c557540b072cc0f19dbf6568e5d6d24f`. `npm ci` installed 59 packages
and reported zero vulnerabilities.

Every exact command in `.factory/claims.json` passed independently:

| Declared claim | Result |
| --- | --- |
| `daily-solvable` | PASS |
| `seed-repeat` | PASS |
| `complete-run` | PASS |
| `restart-reset` | PASS |
| `loss-screen` | PASS |
| `input-controls` | PASS |
| `settings-persist` | PASS |
| `demo-isolation` | PASS |
| `local-only` | PASS |
| `offline-reload` | PASS |
| `frame-rate` | PASS |

`npm test` then passed 8 unit tests and 15 browser tests. `npm run build`
passed and created `dist/`. The production output contains 30.55 KB of
JavaScript (10.47 KB gzip) and 16.08 KB of CSS (4.46 KB gzip). The two missing
claim entries described above keep the untested public claim count at two.

## Live, accessibility, privacy, and performance checks

The complete 15-test browser suite passed again against live HTTPS. It covered
win, loss, restart, keyboard, pointer swipe, on-screen controls, settings,
sample isolation, local requests, offline reload, corrupt-state recovery,
route metadata, reduced motion, 200% text, frame rate, and both repaired short
phone routes.

The URL verifier returned HTTP 200 in 819 ms with no console errors,
`lang="en"`, one `h1`, one `main`, no missing image alternatives, and no
unnamed buttons. Fresh Axe scans returned zero violations of any severity on
`/`, `/demo`, `/settings`, `/privacy`, `/terms`, and the missing route. The
visible skip link has a designed 3 px focus outline. Keyboard route changes
and back/forward navigation focus the new `h1`. At 200% text, all six tested
routes had zero horizontal overflow. The touch-size finding remains despite
these passing checks.

Privacy checks observed only same-origin GET requests during sample play.
There is no account, analytics, advertising, payment flow, external runtime
script, or product backend. Backend tenant, health, restart-persistence, and
429 checks do not apply.

The dedicated offline context reloaded `/demo` after its first visit and ran
the rule example without a connection. The measured board loop was 60.003 fps
across 120 frames under four-times CPU slowdown. Fresh live Lighthouse results
on `/demo` were 90 performance, 100 accessibility, 100 best practices, and
100 SEO, with 1.0 s LCP and 0 CLS.

Known routes, `robots.txt`, `sitemap.xml`, and the manifest returned 200. The
missing route returned the expected 404. All internal links were reachable;
the missing page’s self skip-link also correctly remained on the 404 response.
The external Param Factory link returned 200. HTTPS redirection and CSP, HSTS,
referrer, content-type, frame, and permissions headers are present.

## Candidate and live build comparison

The live root HTML, JavaScript, CSS, and 404 CSS SHA-256 values exactly match
the clean production build. Later commits contain reports and evidence only;
they do not require a new product image. This verifies the live runtime as the
implementation candidate `50e991e6c557540b072cc0f19dbf6568e5d6d24f`.

## Earlier finding disposition

| Earlier item | Current evidence | Disposition |
| --- | --- | --- |
| Service-worker cache matching | Live dedicated-context offline reload passed | Fixed |
| Invalid ARIA board ownership | Axe reported zero violations on every route | Fixed |
| Phone board below 390 × 664 first screen | Board starts at 571.02 px and 586.91 px | Fixed |
| 200% text horizontal overflow | All six tested routes had zero overflow | Fixed |
| Unknown route returned the wrong status | Designed page returned HTTP 404 | Fixed |

The earlier high-severity phone finding is closed. The touch-target and 404
structure findings are separate issues that earlier reports did not record.

## Evidence

- `.factory/evidence/verification-2/live-phone-home.png`
- `.factory/evidence/verification-2/live-phone-demo.png`
- `.factory/evidence/verification-2/live-desktop-home.png`
- `.factory/evidence/verification-2/live-desktop-demo.png`
- `.factory/evidence/verification-2/live-404-phone.png`
- `.factory/evidence/verification-2/live-complete-run-trace.zip`
- `.factory/evidence/verification-2/live-complete-run-end-screen.png`
- `.factory/evidence/verification-2/verify.json`
- `.factory/evidence/verification-2/lighthouse-live.json`

The unambiguous product verdict is **FAIL** with four findings and two
untested public claims.
