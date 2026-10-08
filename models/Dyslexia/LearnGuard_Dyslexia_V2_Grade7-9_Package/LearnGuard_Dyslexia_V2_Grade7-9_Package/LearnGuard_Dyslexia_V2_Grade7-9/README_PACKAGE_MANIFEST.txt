LearnGuard Dyslexia Research Package V2.1 (grade context clarified)

Standalone Google Colab:
  LearnGuard_Dyslexia_Complete_Colab.ipynb
Python research implementation:
  src/dyslexia_core.py
Recorded data manifest (metadata blank where not known):
  manifest_metadata_to_complete.csv
Precomputed artifacts (research-only):
  artifacts/pilot_mfcc_logreg.joblib
  artifacts/feature_schema.json
Precomputed results (from ALL 15 supplied recordings):
  results/audio_quality_audit.csv
  results/audio_features_and_metadata.csv
  results/leave_one_recording_out_predictions.csv
  results/permutation_null.csv
  results/pilot_evaluation.json
  results/pilot_model_coefficients.csv
  results/model_vs_duration_baseline.png
  results/recording_duration_audit.png
Backend and instructions:
  api/app.py
  requirements.txt
  tests/test_pipeline.py
  README_START_HERE.md
  docs/RESEARCH_REPORT.md
  docs/CURSOR_HANDOFF.md

Raw recordings of children deliberately not re-bundled for privacy.
Use your original Dyslexia_Dataset.zip privately for notebook.

Update 2026-10-09: reported cohort grade band is 7–9. Exact participant ages/grades unknown. Model files and trained results unchanged. See docs/DATASET_GRADE_CONTEXT.json and results/dataset_context.json.
