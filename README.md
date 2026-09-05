# Rulebook Relay

Move three couriers across a daily 6×6 board before the 40-move limit. It is a
free, one-player browser puzzle for daily-game players who want a changing rule
without another word grid. Plan for a 3–8 minute run. The game supports touch,
swipe, keyboard arrows, and on-screen controls.

Play the isolated sample at `/demo`. It starts eight moves into a real,
solver-checked route. Sample play uses separate browser storage and never
changes daily progress.

## Game rules

Select Coral, Teal, or Gold, then move one square. Each courier must reach its
matching goal before move 40. One rule card changes each UTC day across a
six-day cycle: tailwind, one-way tiles, ice, relay order, echo movement, then a
wind and one-way remix. The shown seed recreates the same puzzle.

Every generated daily puzzle is checked by the production solver below the
40-move limit. A finished run has a win or loss screen. Restart restores the
move count and every courier. Sound and reduced-motion settings persist in the
browser.

## Privacy and offline use

Progress stays in local browser storage. There are no accounts, analytics,
advertising, third-party scripts, or game-data requests. After the first visit,
the game shell and sample reload offline. `/privacy` explains stored fields and
deletion; `/terms` contains the use terms.

## Clean setup and verification

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
npm test
npm run build
```

`npm test` runs deterministic solver/unit coverage, builds the production
bundle, and runs browser tests with Playwright 1.58.2. The browser suite covers
win, loss, restart, storage recovery, sample isolation, keyboard, phone layout,
route metadata, serious/critical axe findings, offline reload, and request
privacy. It also checks that the board loop remains above 50 fps in a 390×844
Chromium context with four-times CPU slowdown.

Run one public claim with the exact command in `.factory/claims.json`. Start a
local production preview with:

```bash
npm run build
npm run preview
```

Open `http://localhost:4173/demo` for the sample.

## Build and deploy

`npm run build` writes the static product to `dist/`. Deploy that directory to
the product’s static host. `staticwebapp.config.json` rewrites the known app
routes, supplies the designed 404 response, and sets security headers. No
database, secrets, payment service, or runtime API is used.

## Project notes

- `.factory/design.md` records the visual system and original asset provenance.
- `.factory/demo.md` documents sample data and storage isolation.
- `.factory/claims.json` maps each public claim to an outcome test.
- The source image is generated original work; board marks and icons are
  hand-authored for this repository.

## License

MIT. See `LICENSE`.
