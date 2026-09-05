# Verification record — 5 September 2026

## Implementation under test

- Deployed implementation: `55d8ffcbb52d12cce4bf41c757507ab4fe1a695b`
- Live URL: `https://rulebook-relay.sociobot.in`
- Clean clone: `/tmp/rulebook-relay-final-iK5Jv8`

## Clean setup

`npm ci` installed 59 packages and reported zero vulnerabilities. Every exact
command in `.factory/claims.json` passed. This covered 11 claims: two unit
claims and nine browser claims. `npm test` then passed 8 unit tests and 15
browser tests. A final `npm run build` produced `dist/`.

The production bundle contains 30.55 KB of JavaScript (10.47 KB gzip) and
15.95 KB of CSS (4.43 KB gzip). The generated scene is 29 KB and the social
image is 79 KB.

## Hosted browser checks

All 15 Playwright browser checks passed against the HTTPS product after the
final deployment. They covered a complete visible-control run to the win
dialog, a 40-move loss, restart, keyboard, swipe, direction buttons, settings,
sample isolation and reset, local-only requests, offline reload, malformed
storage recovery, route titles and landmarks, axe serious/critical findings,
reduced motion, 200% text, and a fresh 390×844 phone view.

The sample started at move 8, kept its sample banner, reset to move 8, and left
the planted real-data sentinel unchanged. The full run reached “All three
couriers arrived.” Its checked end-screen image is
`tests/e2e/game.spec.ts-snapshots/completed-sample-end-screen-chromium-linux.png`.

The phone loop measured 60.003 fps across 120 frames under four-times Chromium
CPU slowdown. The automated threshold is 50 fps.

The live URL verifier returned HTTP 200 in 761 ms with no console errors, one
`h1`, `lang="en"`, one `main`, no missing image alternatives, and no unnamed
buttons. Final live Lighthouse scores on `/demo` were 95 performance, 100
accessibility, 100 best practices, and 100 SEO. LCP was 1.2 seconds and CLS was
0. The report is `lighthouse.json` in this directory.

The five app routes returned HTTP 200. A random missing route returned HTTP
404 with the designed “Return to today’s courier puzzle” page. The live root
sent CSP, HSTS, referrer, content-type, permissions, and frame protection
headers. The only external footer link returned HTTP 200.
