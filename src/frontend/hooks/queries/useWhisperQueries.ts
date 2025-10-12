import { useQuery } from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";
import { useZustand } from "~/hooks/use-zustand";

export const useWhisperQueries = () => {
	const { runpodApiKey, runpodEndpoint } = useZustand();

	// Use RunPod API base URL for jobs
	const api = fetcher({
		base: runpodEndpoint,
		headers: {
			Authorization: `Bearer ${runpodApiKey}`,
			"Content-Type": "application/json",
		},
	});

	return useQuery({
		queryKey: ["runpod", "health", runpodEndpoint],
		queryFn: async () => {
			if (!runpodApiKey || !runpodEndpoint) {
				throw new Error("RunPod API key and endpoint are required");
			}

			const response = await api.get<{
				jobs: {
					completed: number;
					failed: number;
					inProgress: number;
					inQueue: number;
					retried: number;
				};
				workers: {
					idle: number;
					initializing: number;
					ready: number;
					running: number;
					throttled: number;
					unhealthy: number;
				};
			}>("/health");
			return response;
		},
		enabled: !!runpodApiKey && !!runpodEndpoint,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		// Poll every 10 seconds to monitor health status
		refetchInterval: 10000,
		// Keep polling even when window is not focused
		refetchIntervalInBackground: true,
		// Refetch when window regains focus
		refetchOnWindowFocus: true,
		// Don't refetch on reconnect to avoid excessive requests
		refetchOnReconnect: false,
		// Stale time of 5 seconds - data is considered fresh for 5 seconds
		staleTime: 5000,
		// Cache time of 30 seconds - keep data in cache for 30 seconds after component unmounts
		gcTime: 30000,
	});
};
