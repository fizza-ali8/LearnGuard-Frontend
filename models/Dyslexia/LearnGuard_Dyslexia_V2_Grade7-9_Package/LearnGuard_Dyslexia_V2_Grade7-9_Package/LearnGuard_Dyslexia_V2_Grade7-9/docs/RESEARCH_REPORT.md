# LearnGuard Dyslexia Research Report — supplied dataset (pilot)

## Purpose and boundaries

Explore whether acoustic characteristics of phone recordings differ across the supplied dataset labels. **This dataset cannot establish a clinical dyslexia classifier**; dyslexia is not diagnosed by speech acoustics alone, and no matched, known-age reading protocol or verified transcripts are available.

## Updated population description (2026-10-09)

The project team reports that these recordings were collected from students in grades 7–9. Exact ages and individual grade assignments are unknown and must not be inferred from grade. This is a cohort-level description, not a verified per-child attribute. The pilot model does not use age or grade as an input, so no retraining or metric changes are justified. Do not claim results for grades 1–6 or for the ADHD module’s ages 6–11. The recording-length imbalance and absence of matched reading passages remain unresolved.

The model and reported evaluation figures are unchanged; grade 7–9 is context supplied after the initial experiment, not a model covariate. Do not assume the separate ADHD dataset’s 6–11-year age range applies here.

## Supplied dataset

- 12 files `a1.mp4` to `a12.mp4`, labelled dyslexic by the project team.
- 3 files `New Recording 36.m4a.mp4`, `37`, `38`, labelled normal students/control by the team.
- Audio codecs: AAC in MP4 containers, 48kHz mono source, decoded using ffmpeg to 16kHz mono for analysis.
- Control durations: 4.629, 2.069, 3.413 s. Dyslexic durations: 2.944–144.277 s. One dyslexic recording is also short, but the groups differ profoundly.
- No exact duplicate files by SHA-256; **cannot rule out same child across different files** or different source audio recordings of the same passage.
- The audit estimates speech-like activity using WebRTC VAD. **VAD is not proof of actual reading speech** in noisy recordings.

See `results/audio_quality_audit.csv` for each original.

## Original notebook problem

Old notebook extracted 78 MFCC/delta features for 16 earlier WAV inputs (13 labelled dyslexic, 3 labelled control); the file list included multiple `s3` and `s4` variants. It scaled **all** observations before splitting / CV, leaking evaluation information. It used a complex 1D CNN on feature vectors and reported 100% SVM CV accuracy, which should **not** be accepted as validated screening accuracy. The old folder is not the same as the current 15-original-file zip and may include converted or repeated variants.

## Fixed exploratory protocol

1. Decode and audit **one original file per observation**; do not turn clips into independent training subjects.
2. Use a fixed **1.5-second** activity-rich excerpt in each recording, so no explicit recording duration is provided to acoustic model. This cannot remove recording-condition or task confounding.
3. Extract **8 MFCC summary features** (mean and std for MFCC coefficients 2–5); apply a tiny strongly regularized `LogisticRegression(C=0.1, class_weight='balanced')`.
4. Run leave-one-recording-out CV. For each fold, impute and standardize using **only the 14 training files**. The model, features, C, and threshold 0.5 were fixed rather than tuned on fold results.
5. Compare with majority-class baseline and a **duration-only model** to reveal confounding.
6. Optional exploratory shuffled-label test with 99 permutations; not an external validation nor protection against dataset bias.
7. Fit final research-only pipeline on all 15 inputs and save a joblib file. There is **no untouched test set**. All model use on children must remain disabled.

## Results (computed, not estimated)

| Metric | Acoustic MFCC model | Duration-only control | All-positive baseline |
| --- | ---: | ---: | ---: |
| Accuracy | 66.7% | 93.3% | 80.0% |
| Balanced accuracy | 79.2% | 95.8% | 50.0% |
| Sensitivity (12 positive) | 58.3% (7/12) | 91.7% (11/12) | 100% |
| Specificity (3 control) | 100% (3/3) | 100% (3/3) | 0% |
| ROC-AUC | 0.778 | 0.944 | — |
| Precision (positive) | 100% (7/7 flagged) | 100% (11/11 flagged) | 80% |

MFCC model confusion matrix: **TN 3, FP 0, FN 5, TP 7**. Exact binomial 95% sensitivity interval **27.7%–84.8%**; exact specificity interval **29.2%–100%**. Exploratory shuffled-label permutation p value for acoustic-model balanced accuracy: **0.14** (99 permutations; not compelling evidence of true label-specific reading signal).

**Interpretation:** even simple duration tells the supplied labels apart better than the actual acoustic model. This suggests data-collection confounding, not dyslexia detection. Do not select a higher-accuracy classifier to conceal this issue.

## Output and deployment

- Saved `.joblib` is a **pilot experiment artifact only**. Its probability is not medical risk. Do not load untrusted `.joblib` files; this binary format can execute code on load.
- `api/app.py` accepts an audio upload, returns audio-quality/activity estimates and MFCC research features **without dyslexia classification**; raw upload is placed in a temporary file and removed immediately after processing.
- UI should show "Recorded audio processed" and audio-quality information, plus a research-only disclaimer; no dyslexia positive/negative label, diagnosis, or implied clinical certainty.
- We cannot compute reading speed in words/minute, reading errors, phoneme substitutions or intelligibility without a verified reading task, known text and verified transcript.

## Next data collection if possible

Collect multiple **age- and passage-matched** readings from independent normal and dyslexic children with consent, 30–60s of comparable speech per child if feasible; store child IDs anonymously, language, task/passage, recording device/site, confidence of label, and exact transcripts. Consider validated literacy assessments and external cohort testing. Not every dyslexic child reads the same way. Avoid reporting a clinical sensitivity/specificity from this pilot.
