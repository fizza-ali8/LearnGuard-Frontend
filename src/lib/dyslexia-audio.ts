import axios from "axios";

export const DYSLEXIA_DISCLAIMER =
  "This research audio analysis is not a dyslexia diagnosis or validated dyslexia screen. No risk score is available from this dataset.";

export const DYSLEXIA_ACTIVITY_LABEL =
  "estimated audio activity (not reading speed, not verified speech)";

export const DYSLEXIA_EXTENSIONS = [".mp4", ".m4a", ".wav", ".mp3", ".ogg", ".flac", ".aac"] as const;

export const DYSLEXIA_MAX_BYTES = 15 * 1024 * 1024;

export const DYSLEXIA_SERVICE_URL = "http://127.0.0.1:8001";

export interface DyslexiaAudioAnalysis {
  durationSeconds: number;
  estimatedActivitySeconds: number;
  qualityFlags: string[];
}

export function dyslexiaUploadError(file: { name: string; size: number }) {
  const lower = file.name.toLowerCase();
  const allowed = DYSLEXIA_EXTENSIONS.some((extension) => lower.endsWith(extension));
  if (!allowed) return "Upload an audio file: MP4, M4A, WAV, MP3, OGG, FLAC, or AAC.";
  if (file.size > DYSLEXIA_MAX_BYTES) return "Audio files must be 15 MB or smaller.";
  if (file.size <= 0) return "The audio file is empty.";
  return null;
}

export function qualityCheckText(flags: string[]) {
  if (!flags.length) return "No quality warning.";
  return flags.map((flag) => flag.replaceAll("_", " ")).join(", ");
}

export function publicDyslexiaResult(payload: Record<string, unknown>): DyslexiaAudioAnalysis {
  const flags = Array.isArray(payload.quality_flags)
    ? payload.quality_flags.filter((flag): flag is string => typeof flag === "string")
    : [];
  return {
    durationSeconds: Number(payload.duration_seconds),
    estimatedActivitySeconds: Number(payload.estimated_activity_seconds),
    qualityFlags: flags,
  };
}

function serviceHint() {
  return (process.env.NEXT_PUBLIC_DYSLEXIA_API_URL || DYSLEXIA_SERVICE_URL).replace(/\/$/, "");
}

export async function analyzeDyslexiaAudio(file: File): Promise<DyslexiaAudioAnalysis> {
  const form = new FormData();
  form.append("file", file, file.name);
  const base = (process.env.NEXT_PUBLIC_DYSLEXIA_API_URL || "").replace(/\/$/, "");
  try {
    const response = await axios.post(`${base}/api/dyslexia/analyze`, form, { timeout: 30000 });
    const payload = response.data as Record<string, unknown>;
    if (payload.dyslexia_prediction_available !== false) {
      throw new Error("The analysis model is not loaded on the server.");
    }
    const result = publicDyslexiaResult(payload);
    if (!Number.isFinite(result.durationSeconds) || !Number.isFinite(result.estimatedActivitySeconds)) {
      throw new Error("The audio file could not be analysed.");
    }
    return result;
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) throw error;
    if (axios.isAxiosError(error)) {
      if (!error.response || error.code === "ECONNABORTED") {
        throw new Error(`Cannot reach the analysis server. Make sure the backend is running at ${serviceHint()}.`);
      }
      const status = error.response.status;
      const detail = error.response.data && typeof error.response.data === "object" && "detail" in error.response.data
        ? String((error.response.data as { detail?: unknown }).detail ?? "")
        : "";
      if (status === 503) throw new Error("The analysis model is not loaded on the server.");
      if ((status === 413 || status === 415 || status === 422 || status === 400) && detail) throw new Error(detail);
      throw new Error(detail || "Something went wrong while analysing the audio.");
    }
    throw new Error("Something went wrong while analysing the audio.");
  }
}
