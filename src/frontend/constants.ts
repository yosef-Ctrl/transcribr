export const CHATTY_PODCAST_PARSING = false;

export enum Themes {
    LIGHT = "bumblebee",
    DARK = "luxury",
}

export type PodcastMetadata = {
    podcastName: string;
    episodeName: string;
    date: string;
    description: string;
    previewImageUrl: string | null;
    audioUrl: string | null;
}
