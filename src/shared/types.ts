export interface AppName {
  name: string;
  runpodEndpoint: string;
}

// iTunes API responses
export interface iTunesResult {
	trackId: number;
	trackName: string;
	releaseDate: string;
	description: string;
	artworkUrl600: string | null;
	episodeUrl: string | null;
}

export interface iTunesResponse {
	resultCount: number;
	results: iTunesResult[];
}

// Whisper API Types
export type WhisperSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export type WhisperTranscriptionResult = {
  segments: WhisperSegment[];
  detected_language: string;
  transcription: string;
  translation: string|null;
  device: string;
  model: WhisperModel;
  translation_time: number;
}

export type WhisperJobStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type WhisperModel = "tiny" | "base" | "small" | "medium" | "large-v1" | "large-v2" | "large-v3" | "distil-large-v2" | "distil-large-v3" | "turbo";

export type WhisperInput = {
  audio: string;
  model: WhisperModel;
  transcription?: "plain_text" | "formatted_text" | "vtt" | "srt";
  word_timestamps: boolean;
}

export type WhisperJob = {
  id: string;
  status: WhisperJobStatus;
  output?: WhisperTranscriptionResult;
  error?: string;
  executionTime?: number;
}

export type WhisperJobWithInput = WhisperJob & {
  input: WhisperInput;
}