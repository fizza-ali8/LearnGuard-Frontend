# Cursor integration instructions — LearnGuard Dyslexia research-only backend

You are working inside an existing LearnGuard repository. **Inspect the current framework, API and UI first**; preserve the existing ADHD integration and dysgraphia flows.

Integration assets: `api/app.py`, `src/dyslexia_core.py`, `requirements.txt`, `artifacts/feature_schema.json`, and `docs/RESEARCH_REPORT.md`.

## Population context

The project team reports that these recordings were collected from students in grades 7–9. Exact ages and individual grade assignments are unknown and must not be inferred from grade. This is a cohort-level description, not a verified per-child attribute. The pilot model does not use age or grade as an input, so no retraining or metric changes are justified. Do not claim results for grades 1–6 or for the ADHD module’s ages 6–11. The recording-length imbalance and absence of matched reading passages remain unresolved.

Frontend may display the cohort description in a researcher/admin-only dataset summary, but must not auto-fill an individual child age or grade from it.

## Task

1. Read README and research report. The 3 normal/control recordings are **2–5 seconds**; the acoustic LOOCV model scored 66.7%, while duration-only scored 93.3%. Therefore **do not** serve the research classifier to a child-facing results page or use its probabilities in late fusion.
2. Integrate `POST /api/dyslexia/analyze` as a separate FastAPI module or as a router on the existing Python backend. If backend is not Python, run FastAPI as a private Python service, with existing backend as proxy. Never rewrite existing backend unnecessarily.
3. Use async multipart upload. Do not ask user for age or passage text when not available; do not invent such fields. Enforce allowed audio formats/15MB file size, 4-minute processing cap, reasonable timeouts, safe filenames and strict CORS settings.
4. Do not retain recordings or send them to external ASR APIs. Respect consent, avoid exposing raw data and logs; delete temporary files even on processing failure. Do not store raw child audio publicly or commit it to git.
5. Integrate an upload control and clear upload/pending/error/success states into the existing dyslexia page. On success, display safe details such as duration, estimated activity (not reading speed), and whether the audio passed basic checks. Do not display MFCC raw values unless on a researcher-only screen.
6. Clearly display: "This research audio analysis is not a dyslexia diagnosis or validated dyslexia screen. No risk score is available from this dataset." Do not classify the child as dyslexic or non-dyslexic. Never fabricate thresholds or recommendations.
7. Respect existing authentication and report schema. If report fusion expects a dyslexia risk score, set dyslexia status `not_assessed` (or current project's equivalent) and **exclude it from numerical fusion**. Do not pretend availability or silently substitute 0.
8. Use the project's normal request/error/response mechanisms. Add minimal automated route, validation, privacy and frontend E2E tests. Run tests and show actual results before marking completed.
9. Document exact changed files, integration routes and local startup commands. If the repository lacks a feature or needs decisions, make minimal safe choices and note them.

**Critical:** the saved joblib research classifier may be used offline for research reproducibility, but **not** as the frontend's dyslexia diagnosis or screening engine. That is a deliberate safeguard, not missing integration.
