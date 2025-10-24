import type {
	iTunesResponse,
	iTunesResult,
	MarkAsSeenRequest,
	MarkAsSeenResponse,
	WhisperTranscriptionResult,
} from "@shared/types";
import { fetcher } from "itty-fetcher";
import { debounce } from "radash";
import { useEffect, useState } from "react";
import { CHATTY_PODCAST_PARSING, type PodcastMetadata } from "~/constants";
import { useMarkAsSeenMutation } from "~/hooks/queries/usePodcastQueries";
import { useZustand } from "~/hooks/use-zustand";

const api = fetcher({ base: "/api" });

// Function to check for cached transcript
const checkCachedTranscript = async (
	audioUrl: string,
	model: string = "turbo",
	wordTimestamps: boolean = true,
): Promise<WhisperTranscriptionResult | null> => {
	try {
		CHATTY_PODCAST_PARSING &&
			console.log("🔍 Checking cache for audio URL:", audioUrl);

		const response = await api.get<{
			cached: boolean;
			result?: WhisperTranscriptionResult;
			cacheKey?: string;
		}>(
			`/cache/check?url=${encodeURIComponent(audioUrl)}&model=${model}&word_timestamps=${wordTimestamps}`,
		);

		CHATTY_PODCAST_PARSING && console.log("📊 Cache check response:", response);

		if (response.cached && response.result) {
			CHATTY_PODCAST_PARSING && console.log("✅ Found cached transcript!");
			return response.result;
		}

		CHATTY_PODCAST_PARSING && console.log("❌ No cached transcript found");
		return null;
	} catch (error) {
		console.error("❌ Error checking cache:", error);
		return null;
	}
};

// Function to parse Apple Podcasts URL and extract metadata
const parseApplePodcastUrl = async (
	url: string,
	markAsSeen: (request: MarkAsSeenRequest) => Promise<MarkAsSeenResponse>,
): Promise<{
	metadata: PodcastMetadata;
	cachedTranscript: WhisperTranscriptionResult | null;
} | null> => {
	try {
		CHATTY_PODCAST_PARSING && console.log("🔍 Parsing URL:", url);

		// Extract both podcast ID and episode ID from Apple Podcasts URL
		const podcastIdMatch = url.match(/\/id(\d+)/);
		const episodeIdMatch = url.match(/i=(\d+)/);

		if (!podcastIdMatch) {
			console.error("❌ Could not extract podcast ID from URL:", url);
			throw new Error("Could not extract podcast ID from URL");
		}

		const podcastId = podcastIdMatch[1];
		const episodeId = episodeIdMatch?.[1];

		if (CHATTY_PODCAST_PARSING) {
			console.log("📱 Extracted podcast ID:", podcastId);
			console.log("📱 Extracted episode ID:", episodeId);
		}

		// Try multiple approaches to get episode data
		let episode = null;
		let podcastData: iTunesResponse | null = null;

		// Approach 1: Try to get episode directly by episode ID
		if (episodeId) {
			if (CHATTY_PODCAST_PARSING) {
				console.log("🔄 Trying approach 1: Direct episode lookup");
				console.log(
					"🌐 Making API request to backend for episode ID:",
					episodeId,
				);
			}

			podcastData = await api.get<iTunesResponse>(
				`/itunes/lookup?id=${episodeId}&entity=podcastEpisode&url=${url}`,
			);
			CHATTY_PODCAST_PARSING &&
				console.log("📊 Episode API Response data:", podcastData);

			if (podcastData.resultCount > 0) {
				episode = podcastData.results[0];
				CHATTY_PODCAST_PARSING &&
					console.log("✅ Found episode via direct lookup:", episode);
			}
		}

		// Approach 2: If episode lookup failed, try to get podcast and search for episode
		if (!episode && podcastId) {
			if (CHATTY_PODCAST_PARSING) {
				console.log("🔄 Trying approach 2: Podcast lookup with episode search");
				console.log(
					"🌐 Making API request to backend for podcast ID:",
					podcastId,
				);
			}

			const res = await api.get<string>(
				`/itunes/lookup?id=${podcastId}&entity=podcast`,
			);
			podcastData = (await JSON.parse(res)) as iTunesResponse;
			CHATTY_PODCAST_PARSING &&
				console.log("📊 Podcast API Response data:", podcastData);

			if (podcastData.resultCount > 0) {
				const podcast = podcastData.results[0];
				CHATTY_PODCAST_PARSING && console.log("📻 Found podcast:", podcast);

				// Try to get episodes from the podcast
				if (episodeId) {
					CHATTY_PODCAST_PARSING &&
						console.log(
							"🌐 Making episodes API request to backend for podcast ID:",
							podcastId,
						);

					const res = await api.get<string>(
						`/itunes/lookup?id=${podcastId}&entity=podcastEpisode`,
					);
					const episodesData = (await JSON.parse(res)) as iTunesResponse;
					CHATTY_PODCAST_PARSING &&
						console.log("📊 Episodes API Response data:", episodesData);

					if (episodesData.resultCount > 0) {
						// Search for the specific episode
						CHATTY_PODCAST_PARSING &&
							console.log(
								"🔍 Searching for episode in podcast episodes list:",
								episodeId,
							);
						episode = episodesData.results.find(
							(ep: iTunesResult) => ep.trackId.toString() === episodeId,
						);
						if (CHATTY_PODCAST_PARSING) {
							if (episode) {
								console.log("✅ Found episode in podcast episodes:", episode);
							} else {
								console.log("⚠️ Episode not found in podcast episodes list");
							}
						}
					}
				}
			}
		}

		if (!episode) {
			console.warn("⚠️ No episode data found with any approach");
			return null;
		}

		CHATTY_PODCAST_PARSING && console.log("🔄 Episode:", episode);

		const metadata: PodcastMetadata = {
			podcastName: episode.collectionName || "Unknown Podcast",
			episodeName: episode.trackName || "Unknown Title",
			date: episode.releaseDate
				? new Date(episode.releaseDate).toLocaleDateString()
				: "Unknown Date",
			description: episode.description
				? episode.description.substring(0, 1000)
				: "No description available",
			previewImageUrl: episode.artworkUrl600,
			audioUrl: episode.episodeUrl,
		};

		CHATTY_PODCAST_PARSING && console.log("✅ Parsed metadata:", metadata);

		// if episode URL available, mark as seen
		if (
			episode.episodeUrl &&
			markAsSeen &&
			(!podcastData || podcastData.source !== "cached database")
		) {
			const response = await markAsSeen({
				episodeUrl: url,
				iTunesResult: episode,
			});
			if (!response.success) {
				throw new Error(response.error ?? "Failed to mark episode as seen");
			}
		}

		// Check for cached transcript as soon as we have the audio URL
		let cachedTranscript: WhisperTranscriptionResult | null = null;
		if (episode.episodeUrl) {
			cachedTranscript = await checkCachedTranscript(episode.episodeUrl);
		}

		return { metadata, cachedTranscript };
	} catch (error) {
		console.error("❌ Error parsing podcast URL:", error);
		return null;
	}
};

export const PodcastUpload = () => {
	const {
		podcastUrl,
		setPodcastUrl,
		setPodcastMetadata,
		setTranscriptionResult,
	} = useZustand();

	// Local state for form inputs
	const [podcastUrlInput, setPodcastUrlInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { mutateAsync: markAsSeen } = useMarkAsSeenMutation();

	// Initialize endpoint input with existing Zustand value (if any)
	useEffect(() => {
		if (podcastUrl) {
			setPodcastUrlInput(podcastUrl);
		}
	}, [podcastUrl]);

	// Debounced function for auto-save and metadata parsing
	const debouncedSetPodcastUrl = debounce(
		{ delay: 1000 },
		async (value: string) => {
			setPodcastUrl(value);
			setError(null); // Clear any previous errors

			// Parse metadata if it's an Apple Podcasts URL
			if (value?.includes("podcasts.apple.com")) {
				setIsLoading(true);
				try {
					const result = await parseApplePodcastUrl(value, markAsSeen);
					if (result) {
						setPodcastMetadata(result.metadata);

						// If we found a cached transcript, set it immediately
						if (result.cachedTranscript) {
							console.log(
								"🎉 Found cached transcript, setting it immediately!",
							);
							setTranscriptionResult(result.cachedTranscript);
						}
					} else {
						setError("Episode not found. Please check the URL and try again.");
						setPodcastMetadata(null);
					}
				} catch (error) {
					console.error("Failed to parse podcast metadata:", error);
					setError(
						"Failed to load episode metadata. Please check the URL and try again.",
					);
					setPodcastMetadata(null);
				} finally {
					setIsLoading(false);
				}
			} else {
				setPodcastMetadata(null);
			}
		},
	);

	// Handle input changes with debounced auto-save
	const handlePodcastUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.trim(); // Trim whitespace
		setTranscriptionResult(null);
		setPodcastUrlInput(value);
		debouncedSetPodcastUrl(value);
	};

	// Handle manual refresh/retry
	const handleRefresh = async () => {
		if (podcastUrlInput?.includes("podcasts.apple.com")) {
			setError(null);
			setIsLoading(true);
			try {
				const result = await parseApplePodcastUrl(podcastUrlInput, markAsSeen);
				if (result) {
					setPodcastMetadata(result.metadata);

					// If we found a cached transcript, set it immediately
					if (result.cachedTranscript) {
						console.log("🎉 Found cached transcript, setting it immediately!");
						setTranscriptionResult(result.cachedTranscript);
					}
				} else {
					setError("Episode not found. Please check the URL and try again.");
					setPodcastMetadata(null);
					setTranscriptionResult(null);
				}
			} catch (error) {
				console.error("Failed to parse podcast metadata:", error);
				setError(
					"Failed to load episode metadata. Please check the URL and try again.",
				);
				setPodcastMetadata(null);
				setTranscriptionResult(null);
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<div className="card card-compact bg-base-100 shadow-xl w-full max-w-md">
			<div className="card-body">
				<h2 className="card-title">Podcast Upload</h2>

				{/* Podcast URL Input */}
				<div className="form-control w-full">
					<label htmlFor="podcast-url-input" className="label">
						<span className="label-text">
							<a
								href="https://podcasts.apple.com/us/podcast/bitcoin-core-vs-knots-why-developers-are-fighting-over/id1123922160?i=1000730634660"
								target="_blank"
								rel="noopener noreferrer"
							>
								Apple Podcasts
							</a>{" "}
							URL
						</span>
					</label>
					<div className="join w-full">
						<input
							id="podcast-url-input"
							type="url"
							placeholder="Enter Apple Podcasts URL"
							className="input input-bordered join-item flex-1"
							value={podcastUrlInput}
							onChange={handlePodcastUrlChange}
						/>
						<button
							type="button"
							className="btn btn-outline join-item"
							onClick={handleRefresh}
							disabled={
								!podcastUrlInput ||
								!podcastUrlInput.includes("podcasts.apple.com") ||
								isLoading
							}
						>
							<i className="ri-refresh-line"></i>
						</button>
					</div>
					<div className="label">
						<span className="label-text-alt">
							{isLoading
								? "Loading metadata..."
								: podcastUrl
									? "Metadata loaded"
									: "No podcast URL"}
						</span>
					</div>
				</div>

				{/* Error Display */}
				{error && (
					<div className="alert alert-error">
						<i className="ri-error-warning-line text-xl"></i>
						<span>{error}</span>
					</div>
				)}
			</div>
		</div>
	);
};
