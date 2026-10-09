"""Train the notebook CNN on the saved arrays. Serving uses this model only."""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from preprocess import PREPROCESS_CONFIG
from training.metrics import bootstrap_cis, classification_report

DATA = Path(__file__).resolve().parents[3] / "models" / "Dysgraphia" / "dysgraphia_cnn_data.npz"
OUT = ROOT / "artifacts"
SEED = 42
EPOCHS = 40
MODEL_VERSION = "dysgraphia-cnn-v1"


def build_cnn(input_shape=(128, 384, 1)):
    import tensorflow as tf
    from tensorflow.keras import layers, models

    model = models.Sequential(
        [
            layers.Input(input_shape),
            layers.Conv2D(16, 3, padding="same", activation="relu"),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Conv2D(32, 3, padding="same", activation="relu"),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Conv2D(64, 3, padding="same", activation="relu"),
            layers.BatchNormalization(),
            layers.MaxPooling2D(2),
            layers.Conv2D(64, 3, padding="same", activation="relu"),
            layers.BatchNormalization(),
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.5),
            layers.Dense(32, activation="relu"),
            layers.Dropout(0.3),
            layers.Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    return model


def main() -> None:
    import tensorflow as tf

    random.seed(SEED)
    np.random.seed(SEED)
    tf.random.set_seed(SEED)
    x_train = np.load(DATA / "X_train.npy")
    y_train = np.load(DATA / "y_train.npy").astype(np.float32)
    x_val = np.load(DATA / "X_val.npy")
    y_val = np.load(DATA / "y_val.npy").astype(np.float32)
    x_test = np.load(DATA / "X_test.npy")
    y_test = np.load(DATA / "y_test.npy").astype(int)
    counts = {int(label): int((y_train == label).sum()) for label in (0, 1)}
    class_weight = {label: len(y_train) / (2 * counts[label]) for label in counts}
    model = build_cnn()
    history = model.fit(
        x_train,
        y_train,
        validation_data=(x_val, y_val),
        epochs=EPOCHS,
        batch_size=16,
        class_weight=class_weight,
        verbose=2,
        callbacks=[tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=6, restore_best_weights=True)],
    )
    probabilities = model.predict(x_test, verbose=0).ravel()
    report = classification_report(y_test, probabilities)
    report["ci95"] = bootstrap_cis(y_test, probabilities, seed=SEED)
    report["epochs_ran"] = len(history.history["loss"])
    report["class_weight"] = {str(key): float(value) for key, value in class_weight.items()}
    payload = {
        "model_version": MODEL_VERSION,
        "tensorflow": tf.__version__,
        "seed": SEED,
        "architecture": "notebook small CNN with dropout 0.5/0.3, early stopping, class weights",
        "preprocessing": PREPROCESS_CONFIG,
        "test": report,
        "serving_note": "Decision gate is applied after these numbers. This file is not a diagnosis.",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    model.save(OUT / "dysgraphia_cnn.keras")
    (OUT / "preprocess_config.json").write_text(json.dumps(PREPROCESS_CONFIG, indent=2), encoding="utf-8")
    (OUT / "evaluation.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    fig, axes = plt.subplots(1, 2, figsize=(8, 3))
    axes[0].plot(history.history["loss"], label="train")
    axes[0].plot(history.history["val_loss"], label="val")
    axes[0].set_title("loss")
    axes[0].legend()
    axes[1].plot(history.history["accuracy"], label="train")
    axes[1].plot(history.history["val_accuracy"], label="val")
    axes[1].set_title("accuracy")
    axes[1].legend()
    fig.tight_layout()
    fig.savefig(OUT / "training_curves.png", dpi=120)
    matrix = report["confusion_matrix"]
    fig, ax = plt.subplots(figsize=(3.2, 3))
    ax.imshow([[matrix["tn"], matrix["fp"]], [matrix["fn"], matrix["tp"]]], cmap="Blues")
    ax.set_xticks([0, 1], ["pred 0", "pred 1"])
    ax.set_yticks([0, 1], ["true 0", "true 1"])
    for (row, col), value in np.ndenumerate([[matrix["tn"], matrix["fp"]], [matrix["fn"], matrix["tp"]]]):
        ax.text(col, row, str(value), ha="center", va="center")
    fig.tight_layout()
    fig.savefig(OUT / "confusion_matrix.png", dpi=120)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
