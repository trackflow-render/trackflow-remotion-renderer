# TrackFlow Remotion Renderer — Package Mode Patch

This patch keeps the public GitHub repository generic and adds real-package rendering without committing client data.

## What changed

```text
.github/workflows/render-trackflow-video.yml
remotion-video/scripts/render.mjs
remotion-video/src/types.ts
remotion-video/src/TrackFlowEvidenceVideo.tsx
```

The workflow now supports:

```text
demo_ga4
demo_setup
package
```

For real TrackFlow videos, run with:

```text
source=package
package_id=<opaque package id only>
```

## Required renderer repo secrets

```text
TRACKFLOW_VIDEO_AGE_RECIPIENT
TRACKFLOW_PACKAGE_BASE_URL
TRACKFLOW_PACKAGE_DOWNLOAD_TOKEN
```

Do not put client names, domains, JSON, screenshot URLs, or tokens into workflow inputs.

## Safety behavior

- Downloads package with Authorization header.
- Extracts ZIP safely.
- Requires `video-input.json`.
- Allows only `video-input.json` and `assets/*` inside the package.
- Does not print client JSON.
- Uploads only encrypted `evidence-video.mp4.age`.
- Artifact retention is 1 day.

## Demo still works

```text
Actions → Render TrackFlow Video → Run workflow → source=demo_ga4
Actions → Render TrackFlow Video → Run workflow → source=demo_setup
```
