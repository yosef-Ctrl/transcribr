import { debounce } from "radash";
import { useEffect, useState } from "react";
import { useNameQuery } from "~/hooks/queries/useNameQuery";
import { useZustand } from "~/hooks/use-zustand";

export const ApiInputs = () => {
	const { runpodEndpoint, runpodApiKey, setRunpodEndpoint, setRunpodApiKey } =
		useZustand();

	const { data } = useNameQuery();

	// Local state for form inputs
	const [endpointInput, setEndpointInput] = useState("");
	const [apiKeyInput, setApiKeyInput] = useState("");

	// Initialize once on mount with server default, then let Zustand take over
	useEffect(() => {
		if (!runpodEndpoint && data?.runpodEndpoint) {
			setRunpodEndpoint(data.runpodEndpoint);
			setEndpointInput(data.runpodEndpoint);
		}
	}, [data?.runpodEndpoint, runpodEndpoint, setRunpodEndpoint]);

	// Initialize API key input with existing value (if any)
	useEffect(() => {
		if (runpodApiKey) {
			setApiKeyInput(runpodApiKey);
		}
	}, [runpodApiKey]);

	// Initialize endpoint input with existing Zustand value (if any)
	useEffect(() => {
		if (runpodEndpoint && !endpointInput) {
			setEndpointInput(runpodEndpoint);
		}
	}, [runpodEndpoint, endpointInput]);

	// Debounced functions for auto-save
	const debouncedSetEndpoint = debounce({ delay: 500 }, (value: string) => {
		setRunpodEndpoint(value);
	});

	const debouncedSetApiKey = debounce({ delay: 500 }, (value: string) => {
		setRunpodApiKey(value || null);
	});

	// Handle input changes with debounced auto-save
	const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEndpointInput(value);
		debouncedSetEndpoint(value);
	};

	const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setApiKeyInput(value);
		debouncedSetApiKey(value);
	};

	return (
		<div className="card card-compact bg-base-100 shadow-xl w-full max-w-md">
			<div className="card-body">
				<h2 className="card-title">API Configuration</h2>

				<form>
					{/* API Key Input */}
					<div className="form-control w-full">
						<label htmlFor="apikey-input" className="label">
							<span className="label-text">RunPod API Key</span>
						</label>
						<input
							id="apikey-input"
							type="password"
							placeholder="Enter your API key"
							className="input input-bordered w-full"
							value={apiKeyInput}
							onChange={handleApiKeyChange}
							autoComplete=""
						/>
						<div className="label">
							<span className="label-text-alt">
								{runpodApiKey ? "API key is set" : "No API key"}
							</span>
						</div>
					</div>

					{/* API Endpoint Input */}
					<div className="form-control w-full">
						<label htmlFor="endpoint-input" className="label">
							<span className="label-text">RunPod Endpoint</span>
						</label>
						<input
							id="endpoint-input"
							type="url"
							placeholder="Enter RunPod endpoint URL"
							className="input input-bordered w-full"
							value={endpointInput}
							onChange={handleEndpointChange}
						/>
						<div className="label">
							<span className="label-text-alt">
								<a
									href="https://github.com/runpod-workers/worker-faster_whisper"
									target="_blank"
									rel="noopener noreferrer"
								>
									https://github.com/runpod-workers/worker-faster_whisper
								</a>
							</span>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};
