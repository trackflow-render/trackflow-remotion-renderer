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
if (size > 5 * 1024 * 1024) {
  console.error('[TrackFlow Render] Input JSON is larger than the renderer limit.');
  process.exit(1);
}

const cwd = resolve(process.cwd());
const inputDir = dirname(inputPath);

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

  return `${publicBaseRel}/assets/${outName}`;
};

const sanitizeVisualArray = (visuals) => {
  if (!Array.isArray(visuals)) return [];

  return visuals.slice(0, 8).map((visual, index) => {
    if (!visual || typeof visual !== 'object') return visual;

    const raw = visual.src || visual.path || '';
    const publicSrc = preparePublicAsset(raw, index);

    return {
      ...visual,
      src: publicSrc,
      path: publicSrc
    };
  });
};

rmSync(renderWorkDir, {recursive: true, force: true});
rmSync(publicBaseDir, {recursive: true, force: true});
mkdirSync(renderWorkDir, {recursive: true});
mkdirSync(publicAssetsDir, {recursive: true});
mkdirSync(dirname(outputPath), {recursive: true});

const sanitized = {
  ...parsed
};

if (Array.isArray(parsed.visuals)) {
  sanitized.visuals = sanitizeVisualArray(parsed.visuals);
}

if (Array.isArray(parsed.screenshots)) {
  sanitized.screenshots = sanitizeVisualArray(parsed.screenshots);
}

writeFileSync(sanitizedInputPath, JSON.stringify(sanitized), 'utf8');

console.log('[TrackFlow Render] Starting Remotion render.');
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
