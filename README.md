# transcribr

- paste secret API key, the endpoint's health should pop up automatically

- paste link to episode from Apple Podcasts, the podcast image, details, and owner should appear

- press button to Transcribe. Wait a few minutes

- press button to Copy raw text, paste into GPT chat and ask it to split out the speakers. Raw data includes timestamps, so it is useful to also paste in any chapter markers from the podcast manifest

## development

- deploy RunPod Serverless worker for Whisper using https://github.com/runpod-workers/worker-faster_whisper

- set up KV and R2, update bindings in `wrangler.jsonc`

- install packages

```sh
bun install
```

- run local dev

```sh
bun dev
```

## deployment

- typegen if any parameters have changed


```sh
bun types
```

- deploy via Wrangler

```sh
bun run deploy
```

- [*OPTIONAL*]: link Cloudflare Worker to own subdomain, easiest via Dashboard

## template has UX + DX batteries included

- TailwindCSS v4 + DaisyUI
- Hono backend, with end-to-end type completeness
- Tanstack React Query wrapped around itty-fetcher
- Zustand state management
- Wouter minimalist routing
- lefthook pre-commit hooks
- Biome linting
