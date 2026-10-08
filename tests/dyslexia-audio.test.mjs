import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const disclaimer = "This research audio analysis is not a dyslexia diagnosis or validated dyslexia screen. No risk score is available from this dataset.";
const flow = fs.readFileSync(path.join(root, "src/components/assessment/dyslexia-flow.tsx"), "utf8");
const result = fs.readFileSync(path.join(root, "src/components/results/result-view.tsx"), "utf8");
const libSource = fs.readFileSync(path.join(root, "src/lib/dyslexia-audio.ts"), "utf8");
const api = fs.readFileSync(path.join(root, "backend/dyslexia/api/app.py"), "utf8");

assert.match(libSource, new RegExp(disclaimer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(flow, /DYSLEXIA_DISCLAIMER/);
assert.match(result, /DYSLEXIA_DISCLAIMER/);
assert.equal(flow.includes("research_audio_features"), false);
assert.equal(flow.includes("runAssessment"), false);
assert.equal(flow.includes("Dyslexia detected"), false);
assert.equal(flow.includes("Probability"), false);
assert.match(flow, /DYSLEXIA_ACTIVITY_LABEL/);
assert.equal(libSource.includes("estimated audio activity (not reading speed, not verified speech)"), true);
assert.equal(api.includes("joblib"), false);
assert.match(api, /unlink\(missing_ok=True\)/);

const moduleUrl = pathToFileURL(path.join(root, "src/lib/dyslexia-audio.ts")).href;
const lib = await import(moduleUrl);
assert.equal(lib.DYSLEXIA_DISCLAIMER, disclaimer);
assert.equal(lib.dyslexiaUploadError({ name: "notes.txt", size: 10 }), "Upload an audio file: MP4, M4A, WAV, MP3, OGG, FLAC, or AAC.");
assert.equal(lib.dyslexiaUploadError({ name: "big.wav", size: 15 * 1024 * 1024 + 1 }), "Audio files must be 15 MB or smaller.");
assert.equal(lib.dyslexiaUploadError({ name: "empty.wav", size: 0 }), "The audio file is empty.");
assert.equal(lib.dyslexiaUploadError({ name: "reading.m4a.mp4", size: 1200 }), null);
const shown = lib.publicDyslexiaResult({
  duration_seconds: 2.5,
  estimated_activity_seconds: 1.2,
  quality_flags: ["very_short_recording"],
  research_audio_features: { mfcc_2_mean: 1 },
  dyslexia_prediction_available: false,
});
assert.deepEqual(Object.keys(shown).sort(), ["durationSeconds", "estimatedActivitySeconds", "qualityFlags"]);
assert.equal(JSON.stringify(shown).includes("mfcc"), false);
console.log("dyslexia frontend checks passed");
