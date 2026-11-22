// Ember Duel — the hand-in program (Node 22, standard library only).
// It gathers this repository's game/ and screenshots/ into the output
// directory and writes the dossier the judge reads, using the vendored
// make.fun library. Run it as:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; inside
// the grader /output is the writable directory the program is given.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, as the gate publishes them: the dossier text is
// capped, and the rest refuse an entry the scorer would refuse anyway
// (too many screenshots, one too large, or a game/ too big or too deep).
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) return;
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
}

// Start from a clean output directory so a stale file from an earlier run
// can never ride along into the entry.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, dossierCaps),
);

// A one-line receipt on stdout (the grader checks /output's bytes, not
// this): how many game files and screenshots the entry hands in.
const gameFiles = readdirSync(join(outputDir, 'game')).length;
const shotFiles = existsSync(join(outputDir, 'screenshots'))
  ? readdirSync(join(outputDir, 'screenshots')).length
  : 0;
console.log(`Ember Duel handed in: ${gameFiles} game files, ${shotFiles} screenshots, dossier.json written to ${outputDir}`);
