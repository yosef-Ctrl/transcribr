import type {
	WhisperInput,
	WhisperJob,
	WhisperJobWithInput,
	WhisperModel,
	WhisperTranscriptionResult,
} from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";
import { useEffect, useMemo, useRef } from "react";
import { useZustand } from "~/hooks/use-zustand";

export const useWhisperJob = () => {
	const {
		runpodApiKey,
		runpodEndpoint,
		transcriptionJob,
		setTranscriptionJob,
		setTranscriptionResult,
	} = useZustand();

	// Keep a ref to the current job to avoid dependency issues
	const currentJobRef = useRef<WhisperJobWithInput | null>(transcriptionJob);

	// Update ref when transcriptionJob changes
	useEffect(() => {
		currentJobRef.current = transcriptionJob;
	}, [transcriptionJob]);

	// Create API client for our backend (with caching) - memoized to prevent infinite loops
	const api = useMemo(
		() =>
			fetcher({
				base: "/api",
				headers: {
					Authorization: `Bearer ${runpodApiKey}`,
					"Content-Type": "application/json",
				},
			}),
		[runpodApiKey],
	);

	// Create API client for RunPod (for polling) - memoized to prevent infinite loops
	const runpodApi = useMemo(
		() =>
			fetcher({
				base: runpodEndpoint,
				headers: {
					Authorization: `Bearer ${runpodApiKey}`,
					"Content-Type": "application/json",
				},
			}),
		[runpodEndpoint, runpodApiKey],
	);

	// Start transcription job
	const startTranscriptionMutation = useMutation({
		mutationFn: async (input: {
			audio: string;
			model: WhisperModel;
			word_timestamps: boolean;
			endpoint?: string;
		}) => {
			if (!runpodApiKey) {
				throw new Error("RunPod API key is required");
			}

			console.log("Checking cache for transcription:", input);
			const response = await api.post<{
				cached: boolean;
				result?: WhisperTranscriptionResult;
				jobId?: string;
				input?: WhisperInput;
			}>("/transcribe", input);

			console.log("Transcription response:", response);

			// If cached, return immediately with result
			if (response.cached && response.result) {
				return {
					cached: true,
					result: response.result,
					input,
				};
			}

			// If not cached, return job info for polling
			return {
				cached: false,
				jobId: response.jobId,
				input: response.input,
			};
		},
		onSuccess: (data) => {
			if (data.cached && data.result) {
				// Cached result - set it immediately
				console.log("Using cached transcription result");
				setTranscriptionResult(data.result);
				// Create a fake job to show completion
				const job: WhisperJob = {
					id: `cached-${Date.now()}`,
					status: "COMPLETED",
					output: data.result,
				};
				setTranscriptionJob({ ...job, input: data.input });
			} else if (data.jobId && data.input) {
				// Not cached - create job for polling
				const job: WhisperJob = {
					id: data.jobId,
					status: "IN_QUEUE",
				};
				console.log("Transcription job created:", job);
				setTranscriptionJob({ ...job, input: data.input });
			}
		},
		onError: (error) => {
			console.error("Failed to start transcription job:", error);
		},
	});

	// Poll job status
	const pollJobQuery = useQuery({
		queryKey: ["whisper-job", transcriptionJob?.id],
		queryFn: async () => {
			if (!transcriptionJob?.id || !runpodApiKey) {
				throw new Error("No active job or API key");
			}

			const response = await runpodApi.get<WhisperJob>(
				`/status/${transcriptionJob.id}`,
			);
			return response;
		},
		enabled:
			!!transcriptionJob?.id &&
			!!runpodApiKey &&
			!transcriptionJob.id.startsWith("cached-"),
		refetchInterval: (query) => {
			// Poll more frequently for active jobs
			if (query.state.data?.status === "IN_PROGRESS") {
				return 1500; // Poll every 1.5 seconds for active transcription
			} else if (query.state.data?.status === "IN_QUEUE") {
				return 3000; // Poll every 3 seconds for queued jobs
			} else if (
				query.state.data?.status === "COMPLETED" ||
				query.state.data?.status === "FAILED"
			) {
				return false; // Stop polling for final states
			}
			return false;
		},
	});

	// Handle successful polling updates
	useEffect(() => {
		if (pollJobQuery.data && currentJobRef.current?.input) {
			// Update job in Zustand - preserve existing input if available
			const updatedJob: WhisperJobWithInput = {
				...pollJobQuery.data,
				input: currentJobRef.current.input,
			};
			setTranscriptionJob(updatedJob);

			// If job is completed, store the result and cache it
			if (
				pollJobQuery.data.status === "COMPLETED" &&
				pollJobQuery.data.output
			) {
				setTranscriptionResult(pollJobQuery.data.output);

				// Cache the result - get input from current job state
				api
					.post("/transcribe/complete", {
						jobId: pollJobQuery.data.id,
						result: pollJobQuery.data.output,
						input: currentJobRef.current.input,
					})
					.catch((error) => {
						console.error("Failed to cache result:", error);
					});
			}
		}
	}, [
		api,
		pollJobQuery.data,
		setTranscriptionJob,
		setTranscriptionResult,
	]);

	// Handle polling errors
	useEffect(() => {
		if (pollJobQuery.error) {
			console.error("Failed to poll job status:", pollJobQuery.error);
		}
	}, [pollJobQuery.error]);

	// Get job status (for manual polling)
	const getJobStatus = async (jobId: string): Promise<WhisperJob> => {
		if (!runpodApiKey) {
			throw new Error("RunPod API key is required");
		}

		const response = await runpodApi.get<WhisperJob>(`/${jobId}`);
		return response;
	};

	// Cancel job
	const cancelJobMutation = useMutation({
		mutationFn: async (jobId: string) => {
			if (!runpodApiKey) {
				throw new Error("RunPod API key is required");
			}

			console.log(`Attempting to cancel job: ${jobId}`);
			const response = await runpodApi.post(`/cancel/${jobId}`);
			console.log("Cancel response:", response);
			return response;
		},
		onSuccess: (data, jobId) => {
			console.log(`Successfully cancelled job: ${jobId}`, data);
			// Clear the job from Zustand
			setTranscriptionJob(null);
		},
		onError: (error, jobId) => {
			console.error(`Failed to cancel job ${jobId}:`, error);
		},
	});

	return {
		// Job state
		job: transcriptionJob,
		isPolling: pollJobQuery.isFetching,

		// Start transcription
		startTranscription: startTranscriptionMutation.mutate,
		isStarting: startTranscriptionMutation.isPending,
		startError: startTranscriptionMutation.error,

		// Poll job status
		pollJob: pollJobQuery.refetch,
		pollError: pollJobQuery.error,

		// Manual job operations
		getJobStatus,
		cancelJob: cancelJobMutation.mutate,
		isCancelling: cancelJobMutation.isPending,

		// Utility functions
		clearJob: () => {
			setTranscriptionJob(null);
			setTranscriptionResult(null);
		},
	};
};
