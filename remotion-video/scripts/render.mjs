#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, statSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const args = process.argv.slice(2);

const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const inputPath = resolve(getArg('input', ''));
const outputPath = resolve(getArg('output', 'out/evidence-video.mp4'));

if (!inputPath || !existsSync(inputPath)) {
  console.error('[TrackFlow Render] Input JSON was not found.');
  process.exit(1);
}

let parsed = null;
try {
  const raw = readFileSync(inputPath, 'utf8');
  parsed = JSON.parse(raw);
} catch {
  console.error('[TrackFlow Render] Input JSON is invalid.');
  process.exit(1);
}

if (!parsed || typeof parsed !== 'object') {
  console.error('[TrackFlow Render] Input JSON must be an object.');
  process.exit(1);
}

const schemaVersion = String(parsed.schemaVersion || '').trim();
if (schemaVersion && schemaVersion !== 'trackflow-video-input-v1') {
  console.error('[TrackFlow Render] Unsupported input schema.');
  process.exit(1);
}

const size = statSync(inputPath).size;
if (size > 2 * 1024 * 1024) {
  console.error('[TrackFlow Render] Input JSON is larger than the demo renderer limit.');
  process.exit(1);
}

mkdirSync(dirname(outputPath), {recursive: true});

console.log('[TrackFlow Render] Starting Remotion render.');
console.log('[TrackFlow Render] Client data is intentionally not printed.');

const remotionBin = process.platform === 'win32'
  ? 'node_modules/.bin/remotion.cmd'
  : 'node_modules/.bin/remotion';

const result = spawnSync(
  remotionBin,
  [
    'render',
    'src/Root.tsx',
    'TrackFlowEvidenceVideo',
    outputPath,
    `--props=${inputPath}`,
    '--codec=h264',
    '--overwrite'
  ],
  {
    cwd: resolve(process.cwd()),
    stdio: 'inherit',
    shell: false
  }
);

if (result.error) {
  console.error('[TrackFlow Render] Failed to start Remotion.');
  process.exit(1);
}

if (result.status !== 0) {
  console.error('[TrackFlow Render] Remotion render failed.');
  process.exit(result.status || 1);
}

if (!existsSync(outputPath)) {
  console.error('[TrackFlow Render] Output video was not created.');
  process.exit(1);
}

console.log('[TrackFlow Render] Render completed.');
