# Dyslexia audio integration

This service analyses a recording and returns duration, estimated audio activity, and quality flags. It does not diagnose dyslexia and it does not produce a risk score.

The pilot file `pilot_mfcc_logreg.joblib` is not copied into `backend/dyslexia` and is not loaded. On the research set, that model was less accurate than a duration-only baseline, so it must not be used for screening.

## Run it

1. Install FFmpeg and confirm `ffmpeg -version` works.
2. From the repository root, install the Python packages in `backend/dyslexia/requirements.txt` if they are not already installed.
3. Start the audio service on port 8001:

```bash
npm run dyslexia-api
```

4. Start the site:

```bash
npm run dev
```

The ADHD service, when you need it, stays on port 8000 with `npm run adhd-api`. Do not point the dyslexia service at port 8000.

The browser calls `/api/dyslexia/health`, `/api/dyslexia/info`, and `/api/dyslexia/analyze`. Next.js proxies those paths to `DYSLEXIA_API_URL` (default `http://127.0.0.1:8001`). Leave `NEXT_PUBLIC_API_URL` unset so the rest of the app stays on demonstration data.

## What the page shows

The dyslexia page asks for consent, then accepts one audio file (MP4, M4A, WAV, MP3, OGG, FLAC, or AAC, up to 15 MB). After analysis it shows only:

- duration
- estimated audio activity (not reading speed, not verified speech)
- the quality-check result
- this sentence: "This research audio analysis is not a dyslexia diagnosis or validated dyslexia screen. No risk score is available from this dataset."

Raw audio features are not shown and are not saved. The recording is not stored. Temporary files are deleted when analysis finishes, including when decoding fails.

A saved record is marked not assessed. It is left out of the numerical overall-concern calculation. It is not stored as a score of 0. Earlier demonstration dyslexia scores remain until a new audio analysis is saved for that student, and then the numeric dyslexia entry is removed rather than replaced with 0.

## Privacy

Do not commit recordings. Audio extensions under `models/Dyslexia` are gitignored. The service does not call an external speech API.
