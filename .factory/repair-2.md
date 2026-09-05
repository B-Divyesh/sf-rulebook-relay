# Repair 2 — claims, touch targets, and complete 404 structure

## Verdict

**PASS.** All four findings from independent verification 2 are fixed. No
public claim is untested.

- Implementation: `1a28a7985130c2b80d3e66bace716cc2c89e3b33`
- Live URL: `https://rulebook-relay.sociobot.in`
- Date: 5 September 2026 UTC

## What changed

The README no longer makes the unmeasurable 3–8 minute player-time promise.
It now states the observable session size: every daily route has a verified
18–32 move solution below the 40-move cap. The existing `daily-solvable` claim
now asserts both ends of that range across 42 consecutive dates.

The advertised six-day cycle has its own `rule-cycle` claim. Its test generates
six consecutive dated puzzles, checks the full tailwind → one-way → ice → relay
→ echo → remix order, and exercises each rule through the production movement
function. The remix check proves both its entry restriction and its wind push.

App and static-404 navigation links now have a minimum 44 × 44 CSS px target.
The skip link has the same minimum height. The static 404 uses the shared
information skeleton: wordmark, Demo, Settings, Privacy, Privacy and Terms in
the footer, Param Factory attribution, generated-art note, and version.

The new browser regression opens every app route and the actual `/404.html` in
a fresh 390 × 664 context. It checks the shared structure and measures every
visible link and button. The test fails with the accessible name and rendered
dimensions of any target below 44 × 44 CSS px.

## Clean-checkout verification

A fresh clone at `/tmp/rulebook-relay-repair2-clean-HNaGse` checked out the
implementation SHA above.

- `npm ci`: passed; 59 packages, zero vulnerabilities.
- All 12 exact commands in `.factory/claims.json`: passed separately.
- Each claim tag occurs exactly once in the unit and browser sources.
- `npm test`: 9 unit tests and 16 Playwright tests passed.
- `npm run build`: passed and created `dist/`.
- Initial JavaScript: 30.55 KB raw / 10.42 KB gzip.
- Initial CSS: 16.21 KB raw / 4.49 KB gzip.
- `verify-url.sh` on local `/demo`: passed with no console errors.
- Axe CLI: zero violations on `/`, `/demo`, `/settings`, `/privacy`, `/terms`,
  and `/404.html`.
- Local Lighthouse on `/demo`: 92 performance, 100 accessibility, 100 best
  practices, and 100 SEO; LCP 1.5 s and CLS 0.

## Live verification

The exact implementation was uploaded to the existing
`sf-rulebook-relay` production Static Web App. No DNS, billing, database,
backend, environment, or other product resource was changed.

- The live root HTML exactly matches the built root HTML by SHA-256.
- The full 16-test Playwright suite passed against HTTPS.
- `verify-url.sh` reported no console errors and valid title, language,
  heading, main landmark, image alternatives, and button names.
- Axe CLI found zero violations on all five app routes and an unknown route.
- Live Lighthouse on `/demo`: 92 performance, 100 accessibility, 100 best
  practices, and 100 SEO; LCP 1.2 s and CLS 0.
- The board loop measured 60.006 fps over 120 frames at four-times CPU
  slowdown.
- `/`, `/demo`, `/settings`, `/privacy`, and `/terms` return 200. A missing
  route deliberately returns 404 with the designed recovery page.
- CSP, HSTS, referrer, content-type, frame, and permissions headers are present.

Fresh 1366 × 900 and 390 × 664 browsers show the job, audience, sample action,
and playable board before scrolling. The phone board starts at 571.02 px on
home and 586.91 px in the sample. The sample shows its persistent label and
starts at 8 / 40 moves. The live 404 includes every shared item and has no
undersized visible target.

The visible-control live run reached “All three couriers arrived.” Its trace
and checked end-screen image are under `.factory/evidence/repair-2/live/`.

## Full finding history

| Finding | Current evidence | Disposition |
| --- | --- | --- |
| Service-worker cache matching | Dedicated-context live offline reload passed | Fixed |
| Invalid board ARIA ownership | Live route suite and Axe CLI found zero violations | Fixed |
| Board below a 390 × 664 first screen | Home 571.02 px; sample 586.91 px | Fixed |
| 200% text overflow | Live enlarged-text regression passed | Fixed |
| Unknown route returned the wrong status | Designed recovery page returns HTTP 404 | Fixed |
| Unchecked 3–8 minute promise | Removed; measurable 18–32 move range is claimed and tested | Fixed |
| Unchecked six-day cycle | Exact order and all six movement outcomes are a declared claim | Fixed |
| Mobile navigation below 44 × 44 px | All rendered links and buttons pass the mobile size check | Fixed |
| Incomplete static 404 skeleton | Shared navigation, attribution, and version are present | Fixed |

## Scope and remaining limitation

This is still a free, local-first static browser game. It advertises no paid
offer, so billing metadata is not applicable. There is no backend, account,
multiplayer mode, analytics, or runtime AI; tenant, SQLite, health, restart,
and 429 checks do not apply.

The brief’s return-rate target remains unmeasured because the game deliberately
does not track people. A future opt-in study is the honest way to measure it.
