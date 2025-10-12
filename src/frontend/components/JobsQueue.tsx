import { useWhisperQueries } from "~/hooks/queries/useWhisperQueries";

export const JobsQueue = () => {
	const { data: healthData, isLoading, error, isError, isFetching, dataUpdatedAt } = useWhisperQueries();

	if (isLoading) {
		return (
			<div className="card card-compact bg-base-100 shadow-xl w-full max-w-md">
				<div className="card-body">
					<h2 className="card-title">Jobs Queue</h2>
					<div className="flex justify-center">
						<span className="loading loading-spinner loading-md"></span>
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="card card-compact bg-base-100 shadow-xl w-full max-w-md">
				<div className="card-body">
					<h2 className="card-title">Jobs Queue</h2>
					<div className="alert alert-error">
						<span>Error loading jobs: {error?.message || "Unknown error"}</span>
					</div>
				</div>
			</div>
		);
	}

	const formatLastUpdated = (timestamp: number) => {
		const now = Date.now();
		const diff = now - timestamp;
		const seconds = Math.floor(diff / 1000);

		if (seconds < 60) {
			return `${seconds}s ago`;
		} else if (seconds < 3600) {
			return `${Math.floor(seconds / 60)}m ago`;
		} else {
			return `${Math.floor(seconds / 3600)}h ago`;
		}
	};

	return (
		<div className="card card-compact bg-base-100 shadow-xl w-full max-w-md">
			<div className="card-body">
				<div className="flex items-center justify-between">
					<h2 className="card-title">RunPod Health</h2>
					<div className="flex items-center gap-2">
						{isFetching && (
							<i className="ri-refresh-line animate-spin text-primary"></i>
						)}
						<span className="text-xs text-base-content/60">
							{dataUpdatedAt && formatLastUpdated(dataUpdatedAt)}
						</span>
					</div>
				</div>

				{healthData ? (
					<div className="space-y-4">
						{/* Jobs Status */}
						<div className="bg-base-200 p-3 rounded-lg">
							<h3 className="font-semibold mb-2">Jobs Status</h3>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="flex justify-between">
									<span>Completed:</span>
									<span className="badge badge-success badge-sm">{healthData.jobs.completed}</span>
								</div>
								<div className="flex justify-between">
									<span>In Progress:</span>
									<span className="badge badge-warning badge-sm">{healthData.jobs.inProgress}</span>
								</div>
								<div className="flex justify-between">
									<span>In Queue:</span>
									<span className="badge badge-info badge-sm">{healthData.jobs.inQueue}</span>
								</div>
								<div className="flex justify-between">
									<span>Failed:</span>
									<span className="badge badge-error badge-sm">{healthData.jobs.failed}</span>
								</div>
								<div className="flex justify-between">
									<span>Retried:</span>
									<span className="badge badge-outline badge-sm">{healthData.jobs.retried}</span>
								</div>
							</div>
						</div>

						{/* Workers Status */}
						<div className="bg-base-200 p-3 rounded-lg">
							<h3 className="font-semibold mb-2">Workers Status</h3>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="flex justify-between">
									<span>Ready:</span>
									<span className="badge badge-success badge-sm">{healthData.workers.ready}</span>
								</div>
								<div className="flex justify-between">
									<span>Running:</span>
									<span className="badge badge-warning badge-sm">{healthData.workers.running}</span>
								</div>
								<div className="flex justify-between">
									<span>Idle:</span>
									<span className="badge badge-info badge-sm">{healthData.workers.idle}</span>
								</div>
								<div className="flex justify-between">
									<span>Initializing:</span>
									<span className="badge badge-outline badge-sm">{healthData.workers.initializing}</span>
								</div>
								<div className="flex justify-between">
									<span>Throttled:</span>
									<span className="badge badge-warning badge-sm">{healthData.workers.throttled}</span>
								</div>
								<div className="flex justify-between">
									<span>Unhealthy:</span>
									<span className="badge badge-error badge-sm">{healthData.workers.unhealthy}</span>
								</div>
							</div>
						</div>

						{/* System Status Indicator */}
						<div className="flex items-center justify-center gap-2 text-sm">
							<div className={`w-2 h-2 rounded-full ${
								healthData.workers.ready > 0 ? 'bg-success' :
								healthData.workers.unhealthy > 0 ? 'bg-error' : 'bg-warning'
							}`}></div>
							<span className="text-base-content/70">
								{healthData.workers.ready > 0 ? 'System Ready' :
								 healthData.workers.unhealthy > 0 ? 'System Issues' : 'System Warming Up'}
							</span>
						</div>
					</div>
				) : (
					<div className="text-center text-base-content/50 py-4">
						No health data available. Make sure your RunPod API key and endpoint are configured.
					</div>
				)}
			</div>
		</div>
	);
};
