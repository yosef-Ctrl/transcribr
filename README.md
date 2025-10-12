# transcribr

## quick start

- paste secret API key. Endpoint health should pop up automatically

- paste Apple Podcasts link to episode. Podcast logo, details, and owner should appear

- press button to Transcribe. Wait ~1 minute for 60 minutes of audio

- press button to Copy raw text. Paste into GPT chat and ask it to split out the speakers. The raw data includes timestamps; it is useful to paste chapter markers from the podcast description

## longer blog post

Workflow described [here](https://artlu.bearblog.dev/fast-following-for-95-power-and-5-cost/) as well as a useful prompt to generate pleasant, human-readable transcripts.

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
