"""Shared metric helpers for the offline dysgraphia scripts."""
from __future__ import annotations

import numpy as np
from sklearn.metrics import accuracy_score, balanced_accuracy_score, confusion_matrix, roc_auc_score


def classification_report(y_true: np.ndarray, probabilities: np.ndarray, threshold: float = 0.5) -> dict:
    y_true = np.asarray(y_true).astype(int)
    probabilities = np.asarray(probabilities, dtype=float)
    predicted = (probabilities >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, predicted, labels=[0, 1]).ravel()
    sensitivity = tp / (tp + fn) if (tp + fn) else float("nan")
    specificity = tn / (tn + fp) if (tn + fp) else float("nan")
    return {
        "n": int(len(y_true)),
        "accuracy": float(accuracy_score(y_true, predicted)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, predicted)),
        "sensitivity": float(sensitivity),
        "specificity": float(specificity),
        "roc_auc": float(roc_auc_score(y_true, probabilities)) if len(set(y_true.tolist())) == 2 else None,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def bootstrap_cis(y_true: np.ndarray, probabilities: np.ndarray, seed: int = 42, repeats: int = 2000) -> dict:
    rng = np.random.default_rng(seed)
    y_true = np.asarray(y_true).astype(int)
    probabilities = np.asarray(probabilities, dtype=float)
    keys = ("accuracy", "balanced_accuracy", "sensitivity", "specificity", "roc_auc")
    stored = {key: [] for key in keys}
    n = len(y_true)
    for _ in range(repeats):
        index = rng.integers(0, n, n)
        if len(set(y_true[index].tolist())) < 2:
            continue
        report = classification_report(y_true[index], probabilities[index])
        for key in keys:
            if report[key] is not None and np.isfinite(report[key]):
                stored[key].append(report[key])
    intervals = {}
    for key, values in stored.items():
        arr = np.array(values, dtype=float)
        intervals[key] = {
            "low": float(np.percentile(arr, 2.5)),
            "high": float(np.percentile(arr, 97.5)),
            "resamples": int(len(arr)),
        }
    return intervals
