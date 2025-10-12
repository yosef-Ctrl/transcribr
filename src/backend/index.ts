import type { AppName, iTunesResponse, WhisperModel } from "@shared/types";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { fetcher } from "itty-fetcher";
import invariant from "tiny-invariant";

const app = new Hono<{ Bindings: Cloudflare.Env }>().basePath("/api");

// Generate cache key from audio URL, model, and word_timestamps
async function generateCacheKey(
	audioUrl: string,
	model: WhisperModel,
	wordTimestamps: boolean,
): Promise<string> {
	// Create a proper hash of the audio URL to avoid collisions
	const encoder = new TextEncoder();
	const data = encoder.encode(audioUrl);

	// Use Web Crypto API for a robust hash
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const audioHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);

	return `transcript:${audioHash}:${model}:${wordTimestamps}`;
}

app
	.use(cors())
	.use(secureHeaders())
	.use(csrf())
	.get("/name", (c) => {
		invariant(c.env.NAME, "NAME is not set");
		invariant(c.env.RUNPOD_ENDPOINT, "RUNPOD_ENDPOINT is not set");
		const ret: AppName = {
			name: c.env.NAME,
			runpodEndpoint: c.env.RUNPOD_ENDPOINT,
		};
		return c.json(ret);
	})
	.get("/cache/check", async (c) => {
		const url = c.req.query("url");
		const model = c.req.query("model") || "turbo";
		const word_timestamps = c.req.query("word_timestamps") === "true";

		if (!url) {
			return c.json({ error: "Missing url parameter" }, 400);
		}

		try {
			// Generate cache key for the URL
			console.log("Generating cache key for URL:", url);
			const cacheKey = await generateCacheKey(
				url,
				model as WhisperModel,
				word_timestamps,
			);
			console.log("Cache key:", cacheKey);

			// Check cache
			try {
				const cachedResult = await c.env.WHISPERX_JOBS.get(cacheKey);
				if (cachedResult) {
					console.log("Cache hit for URL:", url);
					return c.json({
						cached: true,
						result: JSON.parse(cachedResult),
						cacheKey,
					});
				}
			} catch {
				console.log("Cache miss for URL:", url);
			}

			try {
				const blob = await c.env.R2.get(cacheKey);
				if (blob) {
					console.log("Blob cache hit for URL:", url);
					return c.json({
						cached: true,
						result: JSON.parse(await blob.text()),
						cacheKey,
					});
				}
			} catch {
				console.log("Blob cache miss for URL:", url);
			}

			return c.json({
				cached: false,
				cacheKey,
			});
		} catch (error) {
			console.error("Cache check error:", error);
			return c.json(
				{ error: error instanceof Error ? error.message : "Unknown error" },
				500,
			);
		}
	})
	.get("/itunes/lookup", async (c) => {
		const id = c.req.query("id");
		const entity = c.req.query("entity") || "podcastEpisode";

		if (!id) {
			return c.json({ error: "Missing id parameter" }, 400);
		}

		try {
			const data = await fetcher({
				base: "https://itunes.apple.com",
			}).get<iTunesResponse>(`/lookup?id=${id}&entity=${entity}`);

			return c.json(data);
		} catch (error) {
			console.error("iTunes API error:", error);
			return c.json(
				{ error: error instanceof Error ? error.message : "Unknown error" },
				500,
			);
		}
	})
	.post("/transcribe", async (c) => {
		try {
			const body = await c.req.json();
			// TODO: validate
			const { audio, model, word_timestamps, endpoint } = body;

			if (!audio || !model) {
				return c.json({ error: "Missing required fields: audio, model" }, 400);
			}

			// Generate cache keys
			const cacheKey = await generateCacheKey(audio, model, word_timestamps || false);

			// Check cache first
			try {
				const cachedResult = await c.env.WHISPERX_JOBS.get(cacheKey);
				if (cachedResult) {
					console.log("Cache hit for key:", cacheKey);
					return c.json({
						cached: true,
						result: JSON.parse(cachedResult),
					});
				}
			} catch {
				console.log("Cache miss for key:", cacheKey);
			}

			const runpodResponse = await fetch(
				`${endpoint ?? c.env.RUNPOD_ENDPOINT}/run`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${c.req.header("Authorization")?.replace("Bearer ", "")}`,
					},
					body: JSON.stringify({
						input: { audio, model, word_timestamps },
					}),
				},
			);

			if (!runpodResponse.ok) {
				throw new Error(`RunPod API error: ${runpodResponse.status}`);
			}

			const runpodData = (await runpodResponse.json()) as { id: string };

			// Return the job ID immediately (don't wait for completion)
			return c.json({
				cached: false,
				jobId: runpodData.id,
				input: { audio, model, word_timestamps },
			});
		} catch (error) {
			console.error("Transcription error:", error);
			return c.json({ error: "Failed to start transcription" }, 500);
		}
	})
	.post("/transcribe/complete", async (c) => {
		try {
			const body = await c.req.json();
			const { jobId, result, input } = body;

			if (!jobId || !result || !input) {
				return c.json(
					{ error: "Missing required fields: jobId, result, input" },
					400,
				);
			}

			// Generate cache key and store result
			const cacheKey = await generateCacheKey(
				input.audio,
				input.model,
				input.word_timestamps,
			);
			try {
				await c.env.WHISPERX_JOBS.put(cacheKey, JSON.stringify(result));
				console.log("Cached transcription result for key:", cacheKey);
			} catch (error) {
				console.error("Cache storage error:", error instanceof Error ? error.message : "Unknown error");
			}
			try {
				await c.env.R2.put(cacheKey, JSON.stringify(result));
				console.log("Stored transcription result for key:", cacheKey);
			} catch (error) {
				console.error("Blob storage error:", error instanceof Error ? error.message : "Unknown error");
			}

			return c.json({ success: true });
		} catch (error) {
			console.error("Cache storage error:", error);
			return c.json({ error: "Failed to cache result" }, 500);
		}
	});

export default app;
