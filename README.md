# Silent Floor

A tiny top-down stealth game: cross three guarded floors and reach the exit unseen.

[![make.fun bounty](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![entry rank](https://make.fun/badge/best-stealth-game-20261121-1759/saidgank/makefun-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![entry reward](https://make.fun/badge/best-stealth-game-20261121-1759/saidgank/makefun-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

Built for make.fun's ["Make the best stealth game"](https://make.fun/bounty/best-stealth-game-20261121-1759) bounty. The game is plain static files — open `game/index.html` in a desktop browser (or run `node serve.ts` and visit the printed address) and play. No build step, no network, no assets: every picture is drawn in code and every sound is synthesized live.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak: slower, but the detection meter fills at half rate
- **Click** — throw a coin: guards within earshot leave their patrol to study it
- **R** — restart the floor · **M** — mute

Guards walk waypoint loops and pause to scan; their vision cones are blocked by walls, crates and server desks, and are drawn as pools of light — shadow is safety. The detection meter fills faster the closer you stand in a cone, and drains when you break sight, so a near miss is recoverable. Floor 3's vault door is locked: lift the gold keycard first.

## Layout

- `game/` — the game itself: `index.html` plus ES modules under `game/src/`, one job each (`levels.js` the floors, `vision.js` the sight raycasts, `guards.js` the patrol AI, `render.js` all drawing, `main.js` the game flow)
- `screenshots/` — four real renders of the game, staged through its own `?shot=` scenes
- `main.ts` — the hand-in program: copies the game and screenshots to the output directory and writes `dossier.json` with the vendored library
- `vendor/makefun-game.ts` — the make.fun dossier library, unchanged

## License

MIT — see `LICENSE`.
