#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import {basename, dirname, extname, isAbsolute, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

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
const explicitInputRoot = getArg('input-root', '');
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

const acceptedSchemas = new Set([
  '',
  'trackflow-video-input-v1',
  'trackflow-remotion-input-v1',
  'trackflow-remotion-video-input-v1',
  'trackflow-evidence-video-input-v1',
  'trackflow-video-package-v1'
]);

const rawSchemaVersion = String(parsed.schemaVersion || parsed.schema_version || '').trim();

if (!acceptedSchemas.has(rawSchemaVersion)) {
  const looksLikeTrackFlowVideoSchema =
    rawSchemaVersion.startsWith('trackflow-') &&
    (
      rawSchemaVersion.includes('video') ||
      rawSchemaVersion.includes('remotion') ||
      rawSchemaVersion.includes('evidence')
    );

  if (!looksLikeTrackFlowVideoSchema) {
    console.error('[TrackFlow Render] Unsupported input schema.');
    process.exit(1);
  }

  console.log('[TrackFlow Render] Compatible TrackFlow schema detected.');
}

const size = statSync(inputPath).size;
if (size > 5 * 1024 * 1024) {
  console.error('[TrackFlow Render] Input JSON is larger than the renderer limit.');
  process.exit(1);
}

const cwd = resolve(process.cwd());
const inputDir = explicitInputRoot ? resolve(explicitInputRoot) : dirname(inputPath);

const renderWorkDir = resolve(cwd, '.trackflow-render-work');
const publicBaseRel = 'trackflow-video-input';
const publicBaseDir = resolve(cwd, 'public', publicBaseRel);
const publicAssetsDir = resolve(publicBaseDir, 'assets');
const sanitizedInputPath = resolve(renderWorkDir, 'video-input.sanitized.json');

const sanitizeFileName = (name, index) => {
  const ext = extname(name || '').toLowerCase() || '.png';
  const base = basename(name || `asset-${index}${ext}`, ext)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `asset-${index}`;

  return `${String(index).padStart(2, '0')}-${base}${ext}`;
};

const resolveAssetPath = (rawValue) => {
  const value = String(rawValue || '').trim();
  if (!value) return '';

  if (/^(?:https?:\/\/|data:image\/|blob:)/i.test(value)) {
    return value;
  }

  if (/^file:\/\//i.test(value)) {
    try {
      return fileURLToPath(value);
    } catch {
      return '';
    }
  }

  if (isAbsolute(value)) {
    return value;
  }

  return resolve(inputDir, value);
};

const shouldCopyAsset = (rawValue) => {
  const value = String(rawValue || '').trim();
  if (!value) return false;
  if (/^(?:https?:\/\/|data:image\/|blob:)/i.test(value)) return false;
  return true;
};

const preparePublicAsset = (rawValue, index) => {
  if (!shouldCopyAsset(rawValue)) {
    return String(rawValue || '').trim();
  }

  const sourcePath = resolveAssetPath(rawValue);
  if (!sourcePath || !existsSync(sourcePath)) {
    return '';
  }

  const sourceStat = statSync(sourcePath);
  if (!sourceStat.isFile() || sourceStat.size <= 0 || sourceStat.size > 25 * 1024 * 1024) {
    return '';
  }

  const outName = sanitizeFileName(sourcePath, index);
  const destPath = join(publicAssetsDir, outName);

  copyFileSync(sourcePath, destPath);

  // Remotion staticFile() expects a path relative to remotion-video/public.
  return `${publicBaseRel}/assets/${outName}`;
};

const getVisualArraysFromInput = (input) => {
  const arrays = [];
  for (const key of ['visuals', 'visualAssets', 'visual_assets', 'screenshots']) {
    if (Array.isArray(input[key])) arrays.push(input[key]);
  }
  return arrays;
};

const sanitizeVisualArray = (visuals, startIndex = 0) => {
  if (!Array.isArray(visuals)) return [];

  return visuals.slice(0, 8).map((visual, localIndex) => {
    if (!visual || typeof visual !== 'object') return visual;

    const index = startIndex + localIndex;
    const raw = visual.src || visual.path || visual.url || '';
    const publicSrc = preparePublicAsset(raw, index);

    return {
      ...visual,
      src: publicSrc,
      path: publicSrc
    };
  });
};

const buildUnifiedVisuals = (input) => {
  const arrays = getVisualArraysFromInput(input);
  const seen = new Set();
  const unified = [];
  let offset = 0;

  for (const array of arrays) {
    const sanitizedItems = sanitizeVisualArray(array, offset);
    offset += sanitizedItems.length;

    for (const item of sanitizedItems) {
      if (!item || typeof item !== 'object') continue;
      const key = `${item.role || ''}|${item.src || item.path || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unified.push(item);
    }
  }

  return unified.slice(0, 8);
};

rmSync(renderWorkDir, {recursive: true, force: true});
rmSync(publicBaseDir, {recursive: true, force: true});
mkdirSync(renderWorkDir, {recursive: true});
mkdirSync(publicAssetsDir, {recursive: true});
mkdirSync(dirname(outputPath), {recursive: true});

const unifiedVisuals = buildUnifiedVisuals(parsed);

const sanitized = {
  ...parsed,
  schemaVersion: 'trackflow-video-input-v1',
  // Force all renderer versions to consume the same cleaned asset list.
  visuals: unifiedVisuals,
  visualAssets: unifiedVisuals,
  visual_assets: unifiedVisuals
};

writeFileSync(sanitizedInputPath, JSON.stringify(sanitized), 'utf8');

console.log('[TrackFlow Render] Starting Remotion render.');
console.log(`[TrackFlow Render] Visual assets prepared: ${unifiedVisuals.length}`);
console.log('[TrackFlow Render] Client data and asset paths are intentionally not printed.');

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
    `--props=${sanitizedInputPath}`,
    '--codec=h264',
    '--overwrite'
  ],
  {
    cwd,
    stdio: 'inherit',
    shell: false
  }
);

rmSync(renderWorkDir, {recursive: true, force: true});
rmSync(publicBaseDir, {recursive: true, force: true});

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
