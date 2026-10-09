"""Offline comparison on handcrafted_features.csv. Not used for serving."""
from __future__ import annotations

import csv
import json
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from metrics import bootstrap_cis, classification_report

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "models" / "Dysgraphia"
OUT = Path(__file__).resolve().parents[1] / "artifacts"
SEED = 42
FEATURES = [
    "ink_density",
    "num_components",
    "char_height_cv",
    "char_width_cv",
    "char_size_ratio_cv",
    "letter_gap_cv",
    "mean_letter_gap_rel",
    "baseline_wobble",
    "stroke_width_mean_rel",
    "stroke_width_cv",
    "touching_letters_ratio",
]


def load() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    with (DATA / "handcrafted_features.csv").open(encoding="utf-8", newline="") as handle:
        features = list(csv.DictReader(handle))
    with (DATA / "file_table_with_splits.csv").open(encoding="utf-8", newline="") as handle:
        files = list(csv.DictReader(handle))
    if [row["child"] for row in features] != [row["path"] for row in files]:
        raise SystemExit("Feature rows are not in the same order as the file table.")
    x = np.array([[float(row[name]) for name in FEATURES] for row in features], dtype=float)
    y = np.array([int(row["label"]) for row in files], dtype=int)
    split = np.array([row["split"] for row in files])
    return x, y, split


def fit_probabilities(name: str, x_train: np.ndarray, y_train: np.ndarray, x_test: np.ndarray) -> np.ndarray:
    if name == "logistic_regression":
        model = make_pipeline(
            StandardScaler(),
            LogisticRegression(class_weight="balanced", random_state=SEED, max_iter=1000),
        )
    else:
        model = RandomForestClassifier(
            n_estimators=400,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=SEED,
            n_jobs=-1,
        )
    model.fit(x_train, y_train)
    return model.predict_proba(x_test)[:, 1]


def main() -> None:
    x, y, split = load()
    train = split == "train"
    test = split == "test"
    results = {
        "note": "Offline comparison only. The child column is the image path, so grouped cross-validation is not a child-level split.",
        "held_out_test": {},
        "stratified_5fold_on_249_originals": {},
    }
    for name in ("logistic_regression", "random_forest"):
        probabilities = fit_probabilities(name, x[train], y[train], x[test])
        report = classification_report(y[test], probabilities)
        report["ci95"] = bootstrap_cis(y[test], probabilities, seed=SEED)
        results["held_out_test"][name] = report
        print(name, "test", {key: report[key] for key in ("accuracy", "balanced_accuracy", "sensitivity", "specificity", "roc_auc")})
        print("  CI", report["ci95"]["balanced_accuracy"], "matrix", report["confusion_matrix"])

        if name == "logistic_regression":
            estimator = make_pipeline(
                StandardScaler(),
                LogisticRegression(class_weight="balanced", random_state=SEED, max_iter=1000),
            )
        else:
            estimator = RandomForestClassifier(
                n_estimators=400,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=SEED,
                n_jobs=-1,
            )
        folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
        cv_prob = cross_val_predict(estimator, x, y, cv=folds, method="predict_proba")[:, 1]
        cv_report = classification_report(y, cv_prob)
        cv_report["ci95"] = bootstrap_cis(y, cv_prob, seed=SEED)
        results["stratified_5fold_on_249_originals"][name] = cv_report
        print(name, "5-fold", {key: cv_report[key] for key in ("accuracy", "balanced_accuracy", "sensitivity", "specificity", "roc_auc")})

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "baseline_evaluation.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print("wrote", OUT / "baseline_evaluation.json")


if __name__ == "__main__":
    main()
