import type { WhisperJobWithInput, WhisperTranscriptionResult } from "@shared/types";
import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";
import type { PodcastMetadata, Themes } from "~/constants";

export const useZustand = create(
	persist(
		combine(
			{
				runpodEndpoint: "",
				runpodApiKey: null as string | null,
				podcastUrl: null as string | null,
				podcastMetadata: null as {
					podcastName: string;
					episodeName: string;
					date: string;
					description: string;
					previewImageUrl: string | null;
					audioUrl: string | null;
				} | null,
				transcriptionJob: null as WhisperJobWithInput | null,
				transcriptionResult: null as WhisperTranscriptionResult | null,
			},
			(set) => ({
				setRunpodEndpoint: (runpodEndpoint: string) => set({ runpodEndpoint }),
				setRunpodApiKey: (runpodApiKey: string | null) => set({ runpodApiKey }),
				setPodcastUrl: (podcastUrl: string | null) => set({ podcastUrl }),
				setPodcastMetadata: (podcastMetadata: PodcastMetadata | null) =>
					set({ podcastMetadata }),
				setTranscriptionJob: (transcriptionJob: WhisperJobWithInput | null) =>
					set({ transcriptionJob }),
				setTranscriptionResult: (transcriptionResult: WhisperTranscriptionResult | null) =>
					set({ transcriptionResult }),
				clearTranscription: () => set({ transcriptionJob: null, transcriptionResult: null }),
			}),
		),
		{
			name: "zustand-store",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

export const useLocalStorageZustand = create(
	persist(
		combine({ themeName: null as Themes | null }, (set) => ({
			setThemeName: (themeName: Themes | null) => set({ themeName }),
		})),
		{
			name: "zustand-store",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
