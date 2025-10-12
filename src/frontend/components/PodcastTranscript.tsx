import type { WhisperSegment } from "@shared/types";
import { useState } from "react";
import { StartTranscriptionButton } from "~/components/StartTranscriptionButton";
import { useZustand } from "~/hooks/use-zustand";

export const PodcastTranscript = () => {
	const { podcastMetadata, transcriptionResult, transcriptionJob } =
		useZustand();
	const [isCopied, setIsCopied] = useState(false);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const copyTimestampedTranscript = async () => {
		if (!transcriptionResult) return;

		// Create timestamped transcript text
		const timestampedText = transcriptionResult.segments
			.map((segment) => `[${formatTime(segment.start)}] ${segment.text}`)
			.join('\n');

		try {
			await navigator.clipboard.writeText(timestampedText);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const renderSegment = (segment: WhisperSegment, index: number) => (
		<div key={index} className="border-l-2 border-primary/20 pl-3 py-2">
			<div className="flex items-center gap-2 text-xs text-base-content/60 mb-1">
				<span className="sr-only">{"{"}"start": </span>
				<span className="font-mono">{formatTime(segment.start)}</span>
				<span className="sr-only">, "text": "</span>
			</div>
			<p className="text-sm leading-relaxed">{segment.text}</p>
			<span className="sr-only">"{"},"}</span>
		</div>
	);

	return (
		podcastMetadata && (
			<div className="card card-compact bg-base-100 shadow-xl w-full max-w-4xl">
				<div className="card-body">
					<h2 className="card-title">Podcast Transcript</h2>

					{/* Transcription Results */}
					{transcriptionResult ? (
						<>
							<div className="divider"></div>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-semibold">Raw Transcript</h3>
									<div className="flex items-center gap-3">
										<button
											type="button"
											onClick={copyTimestampedTranscript}
											className={`btn btn-sm ${
												isCopied ? 'btn-success' : 'btn-outline'
											}`}
											disabled={!transcriptionResult}
										>
											{isCopied ? (
												<>
													<i className="ri-check-line"></i>
													Copied!
												</>
											) : (
												<>
													<i className="ri-clipboard-line"></i>
													Copy Raw Transcript (with Timestamps)
												</>
											)}
										</button>
										<div className="flex items-center gap-2 text-sm text-base-content/60">
											<span>
												Language: {transcriptionResult.detected_language}
											</span>
											<span>•</span>
											<span>Model: {transcriptionResult.model}</span>
											<span>•</span>
											<span>Device: {transcriptionResult.device}</span>
										</div>
									</div>
								</div>

								{/* Full Transcript Text */}
								<div className="bg-base-200 p-4 rounded-lg">
									<h4 className="font-medium mb-2">Full Transcript</h4>
									<p className="text-sm leading-relaxed whitespace-pre-wrap">
										{transcriptionResult.segments
											.map((segment) => segment.text)
											.join(" ")}
									</p>
								</div>

								{/* Transcript Segments */}
								<div className="space-y-2 max-h-96 overflow-y-auto">
									{transcriptionResult.segments.map((segment, index) =>
										renderSegment(segment, index),
									)}
								</div>
							</div>
						</>
					) : (
						<div className="space-y-3">
							{/* Start Transcription Button */}

							<StartTranscriptionButton />
							<div>
								<img
									src={podcastMetadata.previewImageUrl ?? undefined}
									alt="Podcast Preview"
									className="w-full h-auto max-w-xs mx-auto"
								/>
							</div>

							<div>
								<h4 className="font-medium">Name:</h4>
								<p className="text-sm opacity-80">{podcastMetadata.name}</p>
							</div>

							<div>
								<h4 className="font-medium">Date:</h4>
								<p className="text-sm opacity-80">{podcastMetadata.date}</p>
							</div>

							<div>
								<h4 className="font-medium">Description:</h4>
								<p className="text-sm opacity-80 whitespace-pre-wrap">
									{podcastMetadata.description.slice(0, 500)}
									{podcastMetadata.description.length >= 500 && "..."}
								</p>
							</div>
						</div>
					)}

					{/* Job in progress indicator */}
					{transcriptionJob &&
						transcriptionJob.status === "IN_PROGRESS" &&
						!transcriptionResult && (
							<>
								<div className="divider"></div>
								<div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
									<div className="flex items-center gap-3">
										<i className="ri-loader-4-line animate-spin text-warning text-xl"></i>
										<div>
											<div className="font-medium text-warning">
												Transcription in Progress
											</div>
											<div className="text-sm text-base-content/70">
												Processing audio segments... Results will appear here as
												they become available.
											</div>
										</div>
									</div>
								</div>
							</>
						)}

					{/* Job queued indicator */}
					{transcriptionJob && transcriptionJob.status === "IN_QUEUE" && (
						<>
							<div className="divider"></div>
							<div className="bg-info/10 border border-info/20 rounded-lg p-4">
								<div className="flex items-center gap-3">
									<i className="ri-time-line text-info text-xl"></i>
									<div>
										<div className="font-medium text-info">Job Queued</div>
										<div className="text-sm text-base-content/70">
											Waiting for available worker to start transcription...
										</div>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		)
	);
};
