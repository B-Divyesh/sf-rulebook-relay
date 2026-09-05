# Rulebook Relay visual thesis

## Direction

Rulebook Relay uses an **editorial dispatch desk** direction: a top-down paper
map, clipped rule card, rubber route stamps, and small enamel courier counters.
It feels like a physical logic puzzle being checked before the morning route,
not a generic app dashboard. The game board is the dominant object on the
first screen. Generated scene art stays behind solid reading surfaces and
never carries text.

## Palette

The palette comes from rail-office paper, carbon ink, route paint, and brass:

- `paper #F4EEDC` — page background
- `sheet #FFFDF5` — solid reading and game surfaces
- `ink #17252A` — primary text and board lines
- `muted #59686A` — secondary text (7.0:1 on sheet)
- `coral #C34A36` — primary action and courier (4.8:1 with white)
- `teal #087E78` — second courier and focus detail (4.6:1 with white)
- `gold #A56A00` — third courier, used with dark ink text
- `success #246B43`, `warning #8A5700`, `danger #A12E36`
- `night #10191C`, `night-sheet #1B292D`, `night-text #F7F1DF`

The first release follows one explicit light, paper-based treatment. A dark
mode would weaken the printed-rule-card premise, so no incomplete theme switch
is shown. The page background is always painted.

## Type and spacing

- Display: Georgia, Cambria, serif; large editorial headings and rule names.
- Text: system sans (`Inter`-compatible platform stack); controls and body.
- Tabular figures: system monospace for seeds and move counts.
- Scale: 16, 18, 24, 34, and 52 px.
- Spacing: an 8 px base rhythm with 4 px only for tight label pairs.
- Reading measure: 68 characters. Controls are at least 44 × 44 px.

System fonts keep the first load small and avoid third-party font requests.

## Shape and interaction grammar

Paper sections use offset ink shadows, clipped corners, and rule-card tabs.
Buttons look like stamped labels: solid fills, square-rounded corners, and a
2 px ink edge. Courier counters are circular enamel tokens with a letter and
shape, so colour is never the only identifier. Selected counters lift by 2 px
and gain a double outline. The four arrow controls repeat the board grid.

Each accepted move gives immediate board, count, text, and optional sound
feedback. Invalid moves leave the state unchanged and explain why. Win and
loss results appear in a focused dialog with a direct restart action.

## Motion policy

Courier movement uses a 180 ms transform/opacity transition. The selected
counter has one short lift; nothing loops. A fixed 60 Hz input/update loop is
driven by `requestAnimationFrame`, clamps long frames, and pauses while the tab
is hidden. `prefers-reduced-motion` and the saved reduced-motion setting remove
movement while preserving state changes and focus.

## Daily difficulty curve

The six-day cycle introduces one mutation at a time: tailwind, one-way tiles,
ice, relay order, echo movement, then a tailwind and one-way remix. A seeded
generator rejects boards unless the same pure transition function can solve
them in 18–32 moves under the 40-move cap. The date seed is printed beside the
rule card. The sample starts partway through one verified puzzle so a visitor
can finish a real run quickly.

## Asset plan and provenance

- Dominant editorial scene / social card: generated specifically for this
  product with the factory image model, then reviewed and exported to WebP.
  It contains no people, brands, logos, or readable text.
- Courier marks, arrows, goal shapes, rule icons, favicon, and board texture:
  hand-authored SVG/CSS in this repository.
- No stock media or copyrighted characters.

### Image prompt sheet

Use case: stylized-concept. Asset: wide landing and 1200×630 social scene.
Top-down editorial still life of an impossible compact courier dispatch board:
a six-by-six cream paper street grid, three small enamel route counters in
coral, teal, and ochre, folded directional cards, brass clips, inked route
arrows, subtle paper grain, long soft morning shadows. Quiet, tactile,
risograph-meets-photographic paper model, asymmetrical negative space on the
left, exact overhead camera, palette of warm cream, carbon navy, route coral,
deep teal, aged brass. No people, hands, words, letters, numbers, logos,
watermarks, political symbols, maps of real places, UI screenshot, or border.

Generation provenance will be appended with the selected file, model, date,
and full command after inspection.

### Selected generation

- Source: `assets/src/rulebook-relay-scene.png`
- Runtime exports: `public/assets/rulebook-relay-scene-720.webp` (29 KB) and
  `public/assets/rulebook-relay-social.webp` (79 KB)
- Model/deployment: factory image deployment via `/opt/fleet/lib/gen-image.sh`
- Date: 5 September 2026
- Review: accepted; no text artifacts, brands, people, political symbols, or
  visible seams. The image is decorative and does not represent the live board.
- Prompt: the full image prompt sheet above, passed verbatim to the generator.
