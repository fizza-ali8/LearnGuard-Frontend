"""LearnGuard ADHD R&D prototype API; NOT a clinical device."""
import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier, Pool
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, StrictInt

HERE = Path(__file__).resolve().parent
# Handoff artifacts sit beside this file in models/ADHD (not a nested model/ folder).
MODEL_DIR = HERE

META = json.loads((MODEL_DIR / "adhd_model_metadata.json").read_text(encoding="utf-8"))
QUESTIONS = json.loads((MODEL_DIR / "adhd_question_schema.json").read_text(encoding="utf-8"))
FEATURES = META["features"]
CATEGORICAL = META["categorical_features"]
THRESHOLD = float(META["threshold"])

MODEL = CatBoostClassifier()
MODEL.load_model(str(MODEL_DIR / "adhd_catboost_nsch2022.cbm"))
if list(MODEL.feature_names_) != FEATURES:
    raise RuntimeError("Model features do not match saved metadata.")
if set(FEATURES) != set(QUESTIONS):
    raise RuntimeError("Model features and questionnaire fields are inconsistent.")
if set(CATEGORICAL) != set(FEATURES) - {"sc_age_years"}:
    raise RuntimeError("Categorical feature list is inconsistent.")

app = FastAPI(title="LearnGuard ADHD Research API", version="1.0.0")
origins = [x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

class ScreeningRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    answers: dict[str, StrictInt]


def validate_and_prepare(answers: dict[str, int]) -> pd.DataFrame:
    missing = sorted(set(FEATURES) - set(answers))
    extra = sorted(set(answers) - set(FEATURES))
    if missing or extra:
        raise ValueError(f"Wrong questionnaire fields. Missing: {missing}; Unexpected: {extra}")

    for feature in FEATURES:
        value = answers[feature]
        if type(value) is not int:  # Reject bool and fractional numbers
            raise ValueError(f"{feature}: an integer answer code is required.")
        item = QUESTIONS[feature]
        valid_codes = item.get("allowed") if feature == "sc_age_years" else list(item["options"].values())
        if value not in valid_codes:
            raise ValueError(f"{feature}: invalid answer code {value}. Allowed: {valid_codes}")

    # Exactly replicates Colab's prepare_catboost_frame(): age float; all other values strings.
    row = {name: float(answers[name]) if name == "sc_age_years" else str(answers[name]) for name in FEATURES}
    return pd.DataFrame([row], columns=FEATURES)


@app.get("/health")
def health():
    return {"status": "ok", "module": "adhd", "model_loaded": True}


@app.get("/api/adhd/questions")
def questions():
    return {"age_range": [6, 11], "respondent": "parent_or_caregiver", "questions": QUESTIONS}


@app.post("/api/adhd/predict")
def predict(request: ScreeningRequest):
    try:
        row = validate_and_prepare(request.answers)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    score = float(MODEL.predict_proba(row)[0, 1])
    flagged = score >= THRESHOLD
    shap_values = MODEL.get_feature_importance(Pool(row, cat_features=CATEGORICAL), type="ShapValues")[0][:-1]
    top_idx = np.argsort(np.abs(shap_values))[::-1][:5]
    explanation = []
    for i in top_idx:
        key = FEATURES[int(i)]
        code = request.answers[key]
        option = next((name for name, x in QUESTIONS[key].get("options", {}).items() if x == code), str(code))
        explanation.append({
            "feature": key,
            "question": QUESTIONS[key]["label"],
            "answer": option,
            "direction": "toward_flag" if shap_values[i] > 0 else "away_from_flag"
        })

    return {
        "module": "adhd",
        "model_version": "nsch2022-catboost-v1",
        "age_range": [6, 11],
        "screen_positive": bool(flagged),
        # Research-only model score: NOT a child's diagnosed likelihood.
        "model_score": round(score, 5),
        "top_factors": explanation,
        "message": (
            "Elevated ADHD-related screening pattern. Consider discussing concerns with a qualified professional."
            if flagged else
            "No elevated pattern at this research threshold. This does not rule out ADHD; seek advice if concerns persist."
        ),
        "disclaimer": "Research prototype using a US survey. Not a diagnosis, a validated clinical screening instrument, or a replacement for professional evaluation."
    }
