# Rulebook Relay handoff

## Outcome

Rulebook Relay is a complete free daily browser puzzle at
`https://rulebook-relay.sociobot.in`. The first screen states the job as
“Deliver three couriers before 40 moves.” It names daily-puzzle players as the
audience, and the first action is “Try it with sample data.” The playable board
appears on that screen on desktop and phone.

Each UTC day selects one of six rule cards. The deterministic generator keeps
only solver-verified 6×6 puzzles with 18–32 move solutions below the 40-move
limit. Players can win, lose at the move cap, undo, pause, restart, recover
after reload, mute sound, and remove motion. Keyboard, swipe, pointer, and
on-screen direction controls work. The fixed 60 Hz loop pauses in hidden tabs
and clamps delayed frames.

## Sample and data

`/demo` opens a real verified route at move 8. It keeps the label “Demo —
sample data, nothing is saved” visible and provides **Reset demo** and **Start
for real**. Sample keys use `rr:demo:`. Daily progress uses `rr:real:`. Reset
and exit never copy or alter daily progress.

The static product uses no account, backend, database, analytics, payment
flow, third-party script, or runtime AI. Progress and settings stay in local
browser storage. A versioned service worker supports reload after the first
visit. Privacy and terms pages explain storage, clearing, and contact routes.
SQLite is not applicable because there is no server-side product state.

## Visual system

The implemented direction is an editorial courier dispatch desk: cream paper,
carbon ink, coral, teal, and aged brass; stamped controls; clipped rule cards;
and enamel courier counters. `.factory/design.md` records the palette, type,
spacing, motion, difficulty curve, prompt sheet, generation method, inspection,
and asset sizes. Generated art is disclosed in the footer. All functional
marks are hand-authored SVG/CSS.

## Verification

Implementation SHA `55d8ffcbb52d12cce4bf41c757507ab4fe1a695b` is the exact
static build deployed to the live host. The later handoff/evidence commit is
documentation only; its SHA is reported in the final operator response.

From a fresh clone of that implementation:

- `npm ci`: passed; zero vulnerabilities.
- Every command in `.factory/claims.json`: passed individually.
- `npm test`: 8 unit tests and 15 Playwright tests passed.
- `npm run build`: passed and created `dist/`.
- Initial JavaScript: 30.55 KB raw / 10.47 KB gzip.
- Initial CSS: 15.95 KB raw / 4.43 KB gzip.

Against the final HTTPS deployment:

- All 15 Playwright checks passed in fresh browser contexts.
- Win and loss end screens, restart, settings, all inputs, sample isolation,
  offline reload, corrupt-state recovery, reduced motion, and 200% text passed.
- The mobile board loop measured 60.003 fps at four-times CPU slowdown.
- The URL verifier found no console errors or structural accessibility faults.
- Playwright axe found no serious or critical issue on any route.
- Lighthouse: 95 performance, 100 accessibility, 100 best practices, 100 SEO;
  LCP 1.2 s and CLS 0.
- Known routes returned 200. An unknown route returned a deliberate 404 and the
  designed recovery page.
- Security headers and same-origin-only sample requests were confirmed.

Machine evidence is under `.factory/evidence/`. The checked full-run end screen
is under `tests/e2e/game.spec.ts-snapshots/`. The exact clean and live results
are summarized in `.factory/evidence/verification.md`.

## Finding disposition

The base repository contained no earlier handoff or review history. It held
only the researched brief, worker rules, and placeholder README, so there were
no inherited findings to preserve. Findings discovered during this build were
fixed at their causes:

- Service-worker asset misses caused by `Vary: Origin` now use cache matching
  that ignores that irrelevant header; a real offline reload test covers it.
- Invalid ARIA grid ownership was replaced with a labelled board group; every
  route now passes the axe check.
- Phone ordering now puts the board in the first viewport, with 44 px targets.
- Header and sample controls now wrap without horizontal overflow at 200% text.
- Unknown deployed routes no longer inherit the SPA's 200 status; they return
  the designed page with HTTP 404.

## Known limitation and next step

No product function is knowingly incomplete. The brief's return-rate success
measure cannot be observed automatically because this release deliberately has
no analytics or identity. A future study should use explicit opt-in research,
not silent tracking. Paid archives, social gates, multiplayer, and AI were not
added because they are outside this first release.

## Independent verification 1

On 5 September 2026 UTC, an independent verifier reviewed implementation
`55d8ffcbb52d12cce4bf41c757507ab4fe1a695b` and documentation
`6d5394c4db573c011f62de679e05013671d8287a`. The verdict is **PASS** with zero
findings and zero untested claims. See `.factory/verification-1.md` for the
complete clean-checkout, live desktop/mobile, accessibility, privacy, route,
and prior-finding disposition evidence.

## Strict review 1

On 5 September 2026 UTC, the strict review of implementation
`55d8ffcbb52d12cce4bf41c757507ab4fe1a695b` and documentation
`23cf25c79b164eb9796a0d1132fede0b4b3b9a10` found one high-severity issue.
At a fresh 390 × 664 phone viewport, the live board begins below the first
screen on both `/` (705 px) and `/demo` (769 px). The game works after
scrolling, but this fails the browser-game first-screen requirement. All 11
claim commands, the clean `npm test` suite (8 unit and 15 browser tests), the
build, and the live 15-browser-test suite passed; no public claim is untested.
See `.factory/review-1.md`. The current review verdict is **FAIL** until the
short-phone first-screen layout is repaired and reverified.

## Repair 1 — current status

The short-phone layout is now repaired and the strict-review finding is
closed. Implementation SHA
`50e991e6c557540b072cc0f19dbf6568e5d6d24f` is the deployed product build.
Verification documentation and evidence are recorded in
`5c1a8f1b696279ee1b8609ab4b166bb0bb004165`; later report commits contain
documentation only.

On a fresh 390 × 664 phone, the home board begins at 571.02 px and the
populated sample board begins at 586.91 px. Both leave at least 64 px of the
playable board in the first viewport. The compact sample banner retains its
exact label, **Reset demo**, and **Start for real**; at 200% text it wraps
without horizontal overflow.

The repair adds an outcome-based browser regression that visits both `/` and
`/demo` in a fresh 390 × 664 context. It verifies the job, first action, real
sample state, and board geometry. All 11 declared claim commands passed again
individually after `npm ci`; `npm test` passed 8 unit tests and 15 browser
tests; and `npm run build` produced `dist/`.

After deploying, the full live 15-browser-test suite passed. Fresh desktop and
phone views state the job, audience, and first action before scrolling. The
live URL verifier reported HTTPS 200, no console errors, valid basic semantic
structure, and image/button labels. Playwright Axe found no serious or
critical issues. Live Lighthouse on `/demo` scored 91 performance, 100
accessibility, 100 best practices, and 100 SEO (LCP 1.04 s, CLS 0).

See `.factory/repair-1.md` and `.factory/evidence/repair-1/` for the full
finding disposition and machine evidence. No product function remains known
to be incomplete. The return-rate target remains unmeasured because the game
does not collect analytics or identity; any future study must be explicit
opt-in.

## Independent verification 2

On 5 September 2026 UTC, independent verification reviewed implementation
`50e991e6c557540b072cc0f19dbf6568e5d6d24f`, repair evidence commit
`5c1a8f1b696279ee1b8609ab4b166bb0bb004165`, corrected repair record
`c32c51d14b845ba657ea7ad811eff388a5a193df`, and report-only wrapper
`5bcfea3cc5009ec12fc109762c98dd9ab2906919`.

The repaired 390 × 664 first-screen layout passes on `/` and `/demo`. All 11
declared claim commands, the clean 8-unit/15-browser test suite, the build,
and the live 15-browser-test suite passed.

The overall verdict is **FAIL** with four findings and two untested public
claims. `README.md` has unregistered 3–8 minute and exact six-day rule-cycle
claims. Mobile navigation includes touch targets below 44 × 44 CSS px,
especially on the 404 page. The 404 header and footer also omit required
shared navigation, factory attribution, and version/build content. No product
code was changed during verification. See `.factory/verification-2.md` and
`.factory/evidence/verification-2/`.

## Repair 2 — current status

All four independent-verification-2 findings are closed. Implementation SHA
`1a28a7985130c2b80d3e66bace716cc2c89e3b33` is deployed to the live product.
The final documentation/evidence commit is reported separately in the operator
response.

The unmeasurable 3–8 minute README promise was removed. The README now states
the solver-verifiable 18–32 move session size, and the expanded
`daily-solvable` claim checks both limits across 42 dates. A new `rule-cycle`
claim proves the exact six-day order and a movement outcome for each mutation.

Every app and static-404 navigation target now measures at least 44 × 44 CSS
px. The static 404 also contains Settings, footer Privacy and Terms links,
Param Factory attribution, the original-art note, and version content. A fresh
390 × 664 browser regression measures every visible link and button on all
routes and the actual static 404.

From a clean clone, all 12 claim commands passed individually. `npm test`
passed 9 unit tests and 16 browser tests, and `npm run build` created `dist/`.
The production bundle is 30.55 KB JavaScript and 16.21 KB CSS raw.

After deployment, all 16 browser checks passed again against HTTPS. The URL
verifier found no console or structural errors. Axe CLI found zero violations
on six live routes. Lighthouse scored 92 performance and 100 for accessibility,
best practices, and SEO, with 1.2 s LCP and zero CLS. The throttled mobile loop
measured 60.006 fps. A missing route returns the designed page with HTTP 404,
the expected security headers remain present, and the live root exactly matches
the implementation build.

Fresh desktop and 390 × 664 phone sessions show the job, audience, first action,
and board before scrolling. The sample opens at 8 / 40 moves with its persistent
sample label. The full visible-control run reaches the real win dialog; its
trace and end-screen image are in `.factory/evidence/repair-2/live/`.

See `.factory/repair-2.md` for the complete current and earlier finding
disposition. No product function is knowingly incomplete. The only remaining
measurement gap is the brief’s return-rate target, which requires an explicit
opt-in study because this release has no analytics or identity.
