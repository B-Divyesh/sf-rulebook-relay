# Rulebook Relay sample sandbox

- URL: `https://rulebook-relay.sociobot.in/demo`
- Local URL: `http://127.0.0.1:4173/demo` after `npm run build && npm run preview`
- One-click entry: **Try it with sample data** on the first screen.

The sample is seed `20260901`, an eight-move in-progress route using the
**Relay order** card. The board, courier locations, move count, rule example,
and remaining verified route are real game state.

Sample state uses only `localStorage` keys prefixed with `rr:demo:`. Daily play
uses keys prefixed with `rr:real:`. **Reset demo** deletes and reseeds only the
sample prefix. **Start for real** discards the sample prefix before opening the
daily puzzle. The browser regression test plants real sentinel values, plays
and resets the sample, and proves those values did not change.
