// Silent Floor's hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ — plain files a desktop browser
// opens offline. This program delivers it: it copies game/ and screenshots/
// into the output directory and writes dossier.json there with buildDossier
// from the vendored make.fun library, capped exactly as the gate caps it, so
// what is handed in is byte for byte what the scorer rebuilds.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The caps are the sealed gate's own: at most 4 screenshots of 256 KiB, at
// most 993 files and 48 MiB under game/, no game path over 1000 bytes, and
// the dossier's source text held to 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// A one-line receipt, so a local run shows what was handed in.
const parsed = JSON.parse(new TextDecoder().decode(dossier));
const totals = (parsed.text ?? '').split('\n').find((line) => line.startsWith('Totals:')) ?? 'Totals: ?';
console.log(`Silent Floor handed in: ${totals} ${parsed.images?.length ?? 0} screenshots, dossier ${dossier.length} bytes -> ${outDir}`);
