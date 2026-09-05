# Verification 1 — Rulebook Relay

## Verdict: PASS

- Findings: 0
- Untested public claims: 0
- Live URL: `https://rulebook-relay.sociobot.in`
- Implementation reviewed: `55d8ffcbb52d12cce4bf41c757507ab4fe1a695b`
- Documentation commit: `6d5394c4db573c011f62de679e05013671d8287a`
- Verification date: 5 September 2026 UTC

## Job, audience, and first action

Before scrolling in fresh desktop Chrome and a fresh 393 px-wide mobile Chrome
context, the live first screen showed the game board. Its heading says
“Deliver three couriers before 40 moves.” It identifies daily-puzzle players
who want a changing logic rule rather than a word grid. The first primary
action is “Try it with sample data,” with an adjacent explanation that it
opens partway through a verified route. The visible facts state that play is
free, stays in this browser, and reloads offline after the first visit.

## Clean checkout verification

A fresh clone at `/tmp/rulebook-relay-qa-Q6EBis` was used. `npm ci` installed
successfully with zero reported vulnerabilities.

Every exact command declared in `.factory/claims.json` passed independently:

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

`npm test` passed on the final clean rerun: 8 Vitest tests and 15 Playwright
tests. `npm run build` passed and created `dist/`. The production bundle was
30.55 KB JavaScript (10.47 KB gzip) and 15.95 KB CSS (4.43 KB gzip).

One earlier full-suite execution transiently recorded the desktop route/axe
test as failed without an assertion report. The same test immediately passed
when run alone, and the complete suite then passed from the same clean clone.
This is execution history, not a product finding, because it did not reproduce
and no user-visible or assertion failure remained.

## Live verification

The 15-browser-test suite was run again against the HTTPS production URL in
fresh contexts and passed. This exercised a deterministic sample path through
the focused win dialog (“All three couriers arrived”), restart to move zero and
the original courier positions, and a real 40-accepted-move loss dialog. It
also covered arrow keys, swipe, visible direction buttons, pause/resume,
malformed-storage recovery, saved sound and reduced-motion settings, offline
reload, request privacy, reduced motion, 200% text, and a 390 px phone view.
The mobile frame-rate claim passed under four-times CPU throttling.

The sample starts populated at move 8, retains the persistent “Demo — sample
data, nothing is saved” label, resets to move 8, and preserves planted
`rr:real:` sentinel data. The demo therefore remains isolated from real daily
progress.

Fresh live desktop and phone screenshots were inspected. The board, courier
selection, direction controls, rule card, and move counter are usable on the
first screen. The game’s paper-dispatch visual system matches the recorded
design thesis.

## Accessibility, privacy, routes, and links

The live Playwright axe check found no serious or critical issue across `/`,
`/demo`, `/settings`, `/privacy`, `/terms`, and a missing route. Those routes
had their expected unique client-side titles, exactly one `h1`, and one
`main`. A fresh browser reported no console errors on the landing page.

The live root sent CSP, HSTS, referrer, content-type, frame, and permissions
headers. Source inspection found no runtime third-party network endpoint; the
live privacy claim recorded sample-play requests as same-origin GET requests
only. The rendered internal links and the external Param Factory link were
checked; the external link returned HTTP 200. `robots.txt`, `sitemap.xml`,
manifest, privacy, and terms are present.

`/`, `/demo`, `/settings`, `/privacy`, and `/terms` returned HTTP 200. A
random unknown path returned HTTP 404 and the designed recovery page titled
“Page not found — Rulebook Relay”; this expected response is not a defect.

## Earlier finding disposition

The prior handoff listed five repaired issues. All are currently verified:

| Earlier item | Current evidence | Disposition |
| --- | --- | --- |
| Service-worker cache matching | Live offline-reload claim passed | Fixed |
| Invalid ARIA board ownership | Live axe checks passed on every route | Fixed |
| Phone board ordering and target size | Fresh phone review and phone layout test passed | Fixed |
| 200% text overflow | Live 200% text test passed | Fixed |
| Unknown route HTTP status | Live unknown path returned designed HTTP 404 | Fixed |

No backend, tenant, health, rate-limit, or restart-persistence check applies:
this is a static browser game with no product backend or server-side state.

## Evidence classification

Automated clean and live test results, direct HTTPS status/header checks, and
fresh browser visual review support this PASS. No public claim was missing a
declared outcome test, failed, or left untested.
