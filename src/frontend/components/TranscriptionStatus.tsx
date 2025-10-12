import type { WhisperJobStatus } from "@shared/types";
import { useWhisperJob } from "~/hooks/queries/useWhisperJob";
import { useZustand } from "~/hooks/use-zustand";

export const TranscriptionStatus = () => {
	const { transcriptionJob, transcriptionResult } = useZustand();
	const { isPolling, cancelJob, isCancelling, clearJob } = useWhisperJob();

	// Don't show anything if no job is active
	if (!transcriptionJob) {
		return null;
	}

	const getStatusIcon = (status: WhisperJobStatus) => {
		switch (status) {
			case "IN_QUEUE":
				return <i className="ri-time-line text-info"></i>;
			case "IN_PROGRESS":
				return <i className="ri-loader-4-line animate-spin text-warning"></i>;
			case "COMPLETED":
				return <i className="ri-check-line text-success"></i>;
			case "FAILED":
				return <i className="ri-error-warning-line text-error"></i>;
			default:
				return <i className="ri-mic-line"></i>;
		}
	};

	const getStatusText = (status: WhisperJobStatus) => {
		switch (status) {
			case "IN_QUEUE":
				return "Job queued - waiting for worker";
			case "IN_PROGRESS":
				return "Transcribing audio - processing segments";
			case "COMPLETED":
				return "Transcription completed successfully";
			case "FAILED":
				return "Transcription failed";
			default:
				return "Starting transcription";
		}
	};

	const getAlertClass = (status: WhisperJobStatus) => {
		switch (status) {
			case "IN_QUEUE":
				return "alert-info";
			case "IN_PROGRESS":
				return "alert-warning";
			case "COMPLETED":
				return "alert-success";
			case "FAILED":
				return "alert-error";
			default:
				return "alert-info";
		}
	};

	const handleCancelJob = () => {
		console.log("Cancel button clicked, job ID:", transcriptionJob?.id);
		if (transcriptionJob?.id) {
			cancelJob(transcriptionJob.id);
		} else {
			console.error("No job ID available for cancellation");
		}
	};

	const handleClearJob = () => {
		clearJob();
	};

	return (
		<div className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto">
			<div
				className={`alert ${getAlertClass(transcriptionJob.status)} shadow-lg`}
			>
				<div className="flex flex-col items-center justify-between">
					<div className="flex items-center gap-3">
						{getStatusIcon(transcriptionJob.status)}
						<div>
							<div className="font-semibold">
								{getStatusText(transcriptionJob.status)}
							</div>
							<div className="text-sm opacity-80">
								Job ID: {transcriptionJob.id}
								{isPolling && (
									<span className="ml-2">
										<i className="ri-refresh-line animate-spin"></i> Polling
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{/* Progress indicator for in-progress jobs */}
						{transcriptionJob.status === "IN_PROGRESS" && (
							<div className="flex items-center gap-1 text-xs">
								<div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
								<span>Processing</span>
							</div>
						)}

						<div className="flex items-center gap-1 text-xs">
							{/* Action buttons */}
							{(transcriptionJob.status === "IN_QUEUE" ||
								transcriptionJob.status === "IN_PROGRESS") && (
								<button
									type="button"
									className="btn btn-sm btn-outline btn-error"
									onClick={handleCancelJob}
									disabled={isCancelling}
								>
									{isCancelling ? (
										<i className="ri-loader-4-line animate-spin"></i>
									) : (
										<i className="ri-close-line"></i>
									)}
									Cancel
								</button>
							)}

							{(transcriptionJob.status === "COMPLETED" ||
								transcriptionJob.status === "FAILED") && (
								<button
									type="button"
									className="btn btn-sm btn-outline"
									onClick={handleClearJob}
								>
									<i className="ri-close-line"></i>
									Dismiss
								</button>
							)}
						</div>
					</div>

					{/* Error message for failed jobs */}
					{transcriptionJob.status === "FAILED" && transcriptionJob.error && (
						<div className="mt-3 p-3 bg-error/10 border border-error/20 rounded-lg">
							<div className="flex items-start gap-2">
								<i className="ri-error-warning-line text-error mt-0.5"></i>
								<div>
									<div className="font-medium text-error">Job Failed</div>
									<div className="text-sm text-error/80 mt-1">
										{transcriptionJob.error}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Additional info for completed jobs */}
					{transcriptionJob.status === "COMPLETED" && transcriptionResult && (
						<div className="mt-3 pt-3 border-t border-base-content/20">
							<div className="text-sm">
								<span className="font-medium">Results:</span>{" "}
								{transcriptionResult.segments.length.toLocaleString()} segments
							</div>
						</div>
					)}

					{/* Error details for failed jobs */}
					{transcriptionJob.status === "FAILED" && transcriptionJob.error && (
						<div className="mt-3 pt-3 border-t border-base-content/20">
							<div className="text-sm">
								<span className="font-medium">Error:</span>{" "}
								{transcriptionJob.error}
							</div>
						</div>
					)}

					{/* Execution time for completed jobs */}
					{transcriptionJob.executionTime && (
						<div className="mt-2 text-xs opacity-70">
							Execution time: {((transcriptionJob.executionTime ?? 0) / 1000 / 60).toFixed(2)} mins
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
