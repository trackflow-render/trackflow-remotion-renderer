#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

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
const inputRootRaw = getArg('input-root', '');
const inputRoot = inputRootRaw ? resolve(inputRootRaw) : '';
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
const allowedSchemas = new Set(['trackflow-video-input-v1', 'trackflow-remotion-video-input-v1']);
if (schemaVersion && !allowedSchemas.has(schemaVersion)) {
  console.error('[TrackFlow Render] Unsupported input schema.');
  process.exit(1);
}

const size = statSync(inputPath).size;
if (size > 3 * 1024 * 1024) {
  console.error('[TrackFlow Render] Input JSON is larger than the renderer limit.');
  process.exit(1);
}

const toAssetUrl = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^(?:https?:\/\/|data:image\/|blob:|file:)/i.test(text)) return text;
  if (!inputRoot) return text;
  const fullPath = resolve(inputRoot, text.replace(/^\/+/, ''));
  if (!fullPath.startsWith(inputRoot)) return '';
  return pathToFileURL(fullPath).toString();
};

const rawVisuals = Array.isArray(parsed.visuals)
  ? parsed.visuals
  : Array.isArray(parsed.screenshots)
    ? parsed.screenshots
    : Array.isArray(parsed.visualAssets)
      ? parsed.visualAssets
      : Array.isArray(parsed.visual_assets)
        ? parsed.visual_assets
        : [];

const normalizedVisuals = rawVisuals.map((visual) => ({
  ...visual,
  role: visual.role || 'supporting_visual',
  src: toAssetUrl(visual.src || visual.path),
  path: toAssetUrl(visual.path || visual.src),
})).filter((visual) => visual.src || visual.path);

const normalized = {
  ...parsed,
  schemaVersion: 'trackflow-video-input-v1',
  visuals: normalizedVisuals,
};

mkdirSync(dirname(outputPath), {recursive: true});
const normalizedInputPath = resolve(dirname(outputPath), 'normalized-video-input.json');
writeFileSync(normalizedInputPath, JSON.stringify(normalized, null, 2), 'utf8');

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
    `--props=${normalizedInputPath}`,
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
