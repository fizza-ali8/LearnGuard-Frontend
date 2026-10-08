# LearnGuard Dyslexia — Research Module V2.1 (reported grades 7–9)

**Read this first.** This package analyzes the only supplied data: 12 recordings labelled dyslexic and 3 labelled normal/control. It is **not a clinically validated dyslexia screen**. The control clips are only 2.07–4.63 seconds long. The model may be learning task/device differences rather than reading difficulty.

## Updated cohort information (2026-10-09)

The project team reports that these recordings were collected from students in grades 7–9. Exact ages and individual grade assignments are unknown and must not be inferred from grade. This is a cohort-level description, not a verified per-child attribute. The pilot model does not use age or grade as an input, so no retraining or metric changes are justified. Do not claim results for grades 1–6 or for the ADHD module’s ages 6–11. The recording-length imbalance and absence of matched reading passages remain unresolved.

This update changes the **dataset description and Colab report metadata**, not the saved research-only model or experimental numbers. The original V2 notebook logic remains valid.

## What is provided

- `LearnGuard_Dyslexia_Complete_Colab.ipynb`: a **standalone** Colab notebook. It contains its own full processing/training code. You do not need to upload `src/dyslexia_core.py` separately to Colab.
- `results/`: **actual** results computed from the supplied 15 files, including quality audit, model comparison, fold predictions, permutation check, charts and JSON report.
- `artifacts/pilot_mfcc_logreg.joblib`: trained research-only model. **Do not serve its classification or scores as child-facing screening results.**
- `artifacts/feature_schema.json`: matching extraction schema and policy.
- `src/dyslexia_core.py`: standalone version of the same tested processing and training code.
- `api/app.py`: FastAPI audio-upload analysis (no clinical label/probability), suitable for connection to existing frontend.
- `manifest_metadata_to_complete.csv`: record list with blank ages, passages and participant IDs, rather than made-up data.
- `tests/test_pipeline.py`: API, feature, LOO and safety tests.
- `docs/RESEARCH_REPORT.md`, `docs/CURSOR_HANDOFF.md`, and `docs/DATASET_GRADE_CONTEXT.json`.
- `results/dataset_context.json`: cohort-level school grades, not invented individual ages.

**Personal recordings of children are deliberately NOT copied into this distribution.** Keep the original `Dyslexia_Dataset.zip` private and separate. Do not publish it on GitHub.

## Colab: start to end

1. In Google Drive create `MyDrive/LearnGuard/Dyslexia/`.
2. Upload the original file `Dyslexia_Dataset.zip` to that folder **without unzipping it**. It should contain `a1.mp4`–`a12.mp4` and `New Recording 36.m4a.mp4`, `37`, `38` (the provided extension is `.m4a.mp4`).
3. Upload/open `LearnGuard_Dyslexia_Complete_Colab.ipynb` in Google Colab. Choose **CPU**.
4. Use **Runtime → Run all**, grant Drive access, and wait for results. If the zip is not found, change only the `DATASET_ZIP` path shown in Section 2.
5. The notebook writes output under `MyDrive/LearnGuard/Dyslexia/Research_V2/`:
   - `results/audio_quality_audit.csv`: lengths, estimated audio activity and quality notes.
   - `results/audio_features_and_metadata.csv`: 8 MFCC descriptors per 1.5s recording excerpt.
   - `results/leave_one_recording_out_predictions.csv`: out-of-fold scores, **experimental only**.
   - `results/pilot_evaluation.json`: metrics and limitations.
   - `results/dataset_context.json`: cohort-level grades 7–9 and unknown individual ages.
   - `results/permutation_null.csv`: exploratory null distribution.
   - `artifacts/pilot_mfcc_logreg.joblib`: final fit using all 15 recordings, research-only.
   - `artifacts/feature_schema.json`: input schema.
6. Compare newly generated metrics with the included baseline report. If the library environment changes, minor numerical variation is possible.

The model uses **leave-one-recording-out** evaluation (15 folds). There is no sound separate train/validation/test split with just three controls, and participant identities are unverified, so this cannot be called participant-independent evaluation. All scaling is fit inside each training fold. Model hyperparameters and the decision threshold are fixed before evaluation.

## Run backend locally (Windows / VS Code)

Requires Python, `ffmpeg` on PATH. From this package root:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn api.app:app --reload --port 8001
```

Visit `http://localhost:8001/docs`.

API routes:
- `GET /api/dyslexia/health`: service status
- `GET /api/dyslexia/info`: safety limits
- `POST /api/dyslexia/analyze`: multipart form file (`file`) → recording analysis and research acoustic descriptors, **no dyslexia inference**

Frontend request:

```javascript
const form = new FormData();
form.append('file', selectedAudioFile);
const response = await fetch('http://localhost:8001/api/dyslexia/analyze', {
  method: 'POST',
  body: form
});
if (!response.ok) throw new Error('Audio analysis failed');
const result = await response.json();
```

In the frontend, show "Audio quality / research feature analysis" and the warning. Do **not** show a child-level positive/negative screening badge, "risk percentage", age-normed WPM or reading errors until the necessary validated data and protocol exist.

## Why isn't accuracy high?

Simple duration alone yielded **93.3%** leave-one-recording-out accuracy. It is demonstrably exploiting an obvious difference between the group recording protocols. MFCC-based acoustic classification is less confounded by length, but achieves **66.7% accuracy (7/12 positive recordings identified; 3/3 controls left negative)**. The 95% interval for control specificity spans **29.2% to 100%**. A low-data score is not a reliable estimate of dyslexia detection.

To produce credible dyslexia reading-screening results later, collect longer age/passage-matched control readings (several dozen independent controls ideally more), confirm per-child IDs, obtain written passage/transcription, split by child, and externally validate with suitable clinical oversight and informed caregiver consent.
