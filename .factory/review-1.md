# Review 1 — Show the playable game on the first phone screen

## Verdict: FAIL

- Findings: 1
- Untested public claims: 0
- Live URL: `https://rulebook-relay.sociobot.in`
- Implementation reviewed: `55d8ffcbb52d12cce4bf41c757507ab4fe1a695b`
- Documentation reviewed: `23cf25c79b164eb9796a0d1132fede0b4b3b9a10`
- Review date: 5 September 2026 UTC

## Job, audience, and first action

Before scrolling, fresh desktop Chrome and a fresh iPhone 13 browser context
both state the job as “Deliver three couriers before 40 moves.” They identify
daily-puzzle players who want a new logic rule instead of another word grid.
The first action is “Try it with sample data,” which opens a populated,
isolated route. The three visible facts say that play is free, progress stays
in the browser, and the game reloads offline after the first visit.

## Finding

### High — The game board is below the first phone screen

On a fresh iPhone 13 context (390 × 664 CSS px), the home board starts at
705 px, below the 664 px viewport. The sample route has the same problem: its
board starts at 769 px. The initial phone views show the header, large hero
copy, actions, facts, and the top edge of the game sheet, but not the playable
6 × 6 board. Desktop is correct: its board starts at 415 px in a 900 px viewport.

This fails the browser-game requirement that the first screen show the game
itself rather than a menu or landing wall. It also leaves the one-click sample
short of its required immediate populated game view on this standard phone
viewport. A user can scroll to play; that does not satisfy the first-screen
requirement.

Repair the short-phone layout so the game board is visible without scrolling
on both `/` and `/demo`, then add a regression test at 390 × 664 that asserts
the board top is inside the viewport.

## Clean checkout and claims

A clean checkout at implementation `55d8ffcbb52d12cce4bf41c757507ab4fe1a695b`
used `npm ci` successfully with zero reported vulnerabilities. Every exact
command in `.factory/claims.json` passed independently:

| Claim | Result |
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

`npm test` passed: 8 Vitest tests and 15 Playwright tests. `npm run build`
passed and produced `dist/`. The generated JavaScript is 30.55 KB raw
(10.47 KB gzip); CSS is 15.95 KB raw (4.43 KB gzip).

The public claims are each listed in `.factory/claims.json` and have an
outcome test. No public claim was untested. The mobile-first-screen gap is a
functional presentation finding, not an untested claim.

## Live run and sample checks

The same 15 Playwright browser checks passed against the HTTPS deployment.
They completed a deterministic sample run to the win dialog, restarted it,
reached a real 40-move loss dialog, used keyboard arrows, swipe, and visible
direction controls, and tested pause, recovery from malformed saved state,
settings persistence, reduced motion, offline reload, request privacy, and
the measured frame-rate claim.

Direct fresh phone review then opened `/`, used “Try it with sample data,” and
confirmed `/demo` had the persistent “Demo — sample data, nothing is saved”
label, **Reset demo**, **Start for real**, and the populated `8 / 40 moves`
state. It ran the rule example, reset back to `8 / 40 moves`, and left a
planted `rr:real:` sentinel unchanged. The board placement finding above was
observed before any scrolling and is not covered by the existing 390 × 844
layout test.

The win and loss paths, reset, and isolation therefore work. The release still
cannot pass while the board is outside the first 390 × 664 phone viewport.

## Accessibility, privacy, routes, and earlier findings

The live browser suite found no serious or critical axe violations on `/`,
`/demo`, `/settings`, `/privacy`, `/terms`, or the missing route. The factory
URL verifier passed on the live root: HTTP 200, title, `lang="en"`, one `h1`,
one `main`, no images missing alt text, no unnamed buttons, and no console
errors. It measured a 694 ms network-idle load in its desktop context.

Known routes returned HTTP 200. A random unknown route returned HTTP 404 with
the designed recovery page, so that expected 404 is not a finding. Root
headers included CSP, HSTS, Referrer-Policy, X-Content-Type-Options,
X-Frame-Options, and Permissions-Policy. The local-only claim's request test
passed with same-origin requests only. No backend applies to this static game.

Earlier items recorded by the verifier remain fixed:

| Earlier item | Current disposition |
| --- | --- |
| Service-worker cache matching | Fixed; live offline-reload claim passed. |
| Invalid ARIA board ownership | Fixed; live axe checks passed. |
| Phone board ordering and target size | Partly regressed: targets are usable, but the board is not visible in the 390 × 664 first screen. |
| 200% text overflow | Fixed; live 200% text test passed. |
| Unknown route HTTP status | Fixed; live unknown route returned HTTP 404. |

## Evidence classification

The claim, local suite, build, live suite, URL verification, route status, and
header results are automated evidence. The failing phone layout is direct
fresh-browser visual and geometry evidence: board top 705 px on `/` and
769 px on `/demo` against a 664 px viewport. The implementation bytes match
the deployed root HTML checksum, so later documentation-only commits do not
change the reviewed product image.
