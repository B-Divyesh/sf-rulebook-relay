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
