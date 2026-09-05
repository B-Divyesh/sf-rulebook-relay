# Repair 1 — Show the playable board on a short phone screen

## Verdict

**PASS.** The strict-review finding is fixed. There are no remaining product
findings and no untested public claims.

- Implementation: `50e991e5ec9a4a15f2ec8aee91cf18d0d9adb279`
- Live URL: `https://rulebook-relay.sociobot.in`
- Date: 5 September 2026 UTC

## What changed

At 390 × 664, the old mobile layout placed the game heading and score above
the board. The board began at 704.64 px on `/` and 768.53 px on `/demo`.
The demo banner stacked its controls, which added 106 px before the sample.

The mobile game sheet now puts the board and its controls first, before the
puzzle heading, score, and rule card. The demo banner keeps its persistent
sample label and actions, but uses one compact row at normal text size. It
wraps safely when text is enlarged.

The browser regression test uses a fresh 390 × 664 phone context for both
`/` and `/demo`. It confirms the plain job, first action, real populated
sample state, and a board top at least 64 px inside the viewport. This checks
the visible outcome rather than CSS source text.

## Fresh-browser result

Before scrolling, a fresh desktop browser states the job “Deliver three
couriers before 40 moves” and offers “Try it with sample data”; its board
starts at 414.67 px in a 1366 × 900 viewport.

Before scrolling, a fresh 390 × 664 phone browser states the job, identifies
daily-puzzle players, offers the sample action, and shows the facts. Its home
board starts at 571.02 px. After the one-click sample action, `/demo` keeps
“Demo — sample data, nothing is saved,” shows `8 / 40 moves`, and starts its
board at 586.91 px. The two fresh-phone screenshots are in
`.factory/evidence/repair-1/`.

## Verification

From the documented clean setup, `npm ci` completed with zero vulnerabilities.
Every exact command in `.factory/claims.json` passed independently: the two
unit claims and all nine browser claims. `npm test` passed all 8 unit tests
and all 15 browser tests. `npm run build` produced `dist/`.

The initial production assets are 30.55 KB JavaScript raw (10.47 KB gzip) and
16.08 KB CSS raw (4.46 KB gzip). The generated hero image remains 29 KB.

The exact deployed implementation was checked on HTTPS after deployment:

- The full 15-test Playwright suite passed in fresh contexts, including a
  deterministic run to the real win screen, a 40-move loss, restart, all
  advertised inputs, settings persistence, demo reset/isolation, offline
  reload, reduced motion, 200% text, and the 390 × 664 layout.
- The frame-rate claim passed with four-times CPU slowdown.
- `verify-url.sh` returned HTTPS 200 in 819 ms with no console errors, a
  title, `lang="en"`, one `h1`, one `main`, and no missing image alt text or
  unnamed buttons.
- The existing Playwright Axe integration found no serious or critical issue
  on `/`, `/demo`, `/settings`, `/privacy`, `/terms`, or the designed missing
  route.
- Lighthouse on live `/demo`: 91 performance, 100 accessibility, 100 best
  practices, and 100 SEO; LCP 1.04 s and CLS 0.
- `/`, `/demo`, `/settings`, `/privacy`, and `/terms` return 200. A missing
  path deliberately returns the designed 404 page with HTTP 404.
- Live headers include CSP, HSTS, referrer policy, content-type protection,
  frame protection, and permissions policy.

## Earlier findings

| Finding | Current disposition | Evidence |
| --- | --- | --- |
| Service-worker cache matching | Fixed | Live offline reload claim passed. |
| Invalid ARIA board ownership | Fixed | Live Axe suite passed. |
| Phone ordering and target size | Fixed | New 390 × 664 outcome test and fresh-phone geometry passed. |
| 200% text overflow | Fixed | Mobile zoom test passed after the compact banner wraps safely. |
| Unknown route status | Fixed | Live missing path returned HTTP 404 and the recovery page. |

## Scope and known gaps

This remains a free static browser game. It has no product backend, account,
payment offer, analytics, or external runtime integration, so no backend,
tenant, billing, or rate-limit check applies. The optional future archive from
the brief is not an advertised offer and no billing metadata is required.
Return-rate measurement remains intentionally unavailable without an explicit
opt-in study.
