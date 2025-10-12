import { useWhisperJob } from "~/hooks/queries/useWhisperJob";
import { useZustand } from "~/hooks/use-zustand";

export const StartTranscriptionButton = () => {
	const { podcastMetadata, runpodApiKey, runpodEndpoint, transcriptionJob, transcriptionResult } = useZustand();
	const { startTranscription, isStarting } = useWhisperJob();

	const canStartTranscription =
		podcastMetadata?.audioUrl &&
		runpodApiKey &&
		runpodEndpoint &&
		!transcriptionJob &&
		!isStarting;

	const handleStartTranscription = () => {
		if (!podcastMetadata?.audioUrl) {
			console.error("No audio URL available");
			return;
		}

		startTranscription({
			audio: podcastMetadata.audioUrl,
			model: "turbo",
			word_timestamps: true,
			endpoint: runpodEndpoint,
		});
	};

	if (!podcastMetadata?.audioUrl) {
		return (
			<div className="text-xs text-base-content/50 text-center py-2">
				Load a podcast episode to start transcription
			</div>
		);
	}

	if (!runpodApiKey || !runpodEndpoint) {
		return (
			<div className="text-xs text-warning text-center py-2">
				Configure your RunPod API key and endpoint to start transcription
			</div>
		);
	}

	if (transcriptionJob) {
		return (
			<div className="text-xs text-info text-center py-2">
				Transcription job is already active - check status at the top of the page
			</div>
		);
	}

	if (transcriptionResult) {
		return (
			<div className="text-xs text-success text-center py-2">
				<i className="ri-check-line"></i> Transcript is ready - view below
			</div>
		);
	}

	return (
		<button
			type="button"
			className={`btn btn-primary w-full ${isStarting ? 'loading' : ''}`}
			onClick={handleStartTranscription}
			disabled={!canStartTranscription}
		>
			{!isStarting && <i className="ri-mic-line"></i>}
			{isStarting ? 'Starting...' : 'Start Transcription'}
		</button>
	);
};
