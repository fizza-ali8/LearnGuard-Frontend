"""Audit the saved dysgraphia tables and arrays. Does not modify them."""
from __future__ import annotations

import csv
from pathlib import Path

import numpy as np
from scipy.stats import pointbiserialr

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "models" / "Dysgraphia"
NPZ = DATA / "dysgraphia_cnn_data.npz"


def load_table(name: str) -> list[dict[str, str]]:
    with (DATA / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def corr(labels: np.ndarray, values: np.ndarray, title: str) -> None:
    mask = np.isfinite(values)
    if mask.sum() < 3 or len(set(labels[mask].tolist())) < 2:
        print(f"{title}: not enough variation")
        return
    r, p = pointbiserialr(labels[mask], values[mask])
    print(f"{title}: r={r:.3f} p={p:.4g}  class0_mean={values[mask & (labels == 0)].mean():.4g}  class1_mean={values[mask & (labels == 1)].mean():.4g}")


def main() -> None:
    files = load_table("file_table_with_splits.csv")
    features = load_table("handcrafted_features.csv")
    print("file_table", len(files), "handcrafted", len(features))
    labels = np.array([int(row["label"]) for row in files])
    splits = np.array([row["split"] for row in files])
    heights = np.array([float(row["h"]) for row in files])
    widths = np.array([float(row["w"]) for row in files])
    print("label counts", {int(k): int((labels == k).sum()) for k in (0, 1)})
    print("split counts", {name: int((splits == name).sum()) for name in ("train", "val", "test")})
    for name in ("train", "val", "test"):
        part = labels[splits == name]
        print(f"  {name} labels 0={(part == 0).sum()} 1={(part == 1).sum()}")
    paths = [row["path"] for row in files]
    names = [row["file"] for row in files]
    children = [row["child"] for row in files]
    print("unique paths", len(set(paths)), "unique files", len(set(names)), "unique child", len(set(children)))
    print("child equals path", sum(a == b for a, b in zip(children, paths)))
    print("duplicate paths", len(paths) - len(set(paths)), "duplicate filenames", len(names) - len(set(names)))
    path_splits: dict[str, set[str]] = {}
    for row in files:
        path_splits.setdefault(row["path"], set()).add(row["split"])
    leaked = [path for path, found in path_splits.items() if len(found) > 1]
    print("paths in more than one split", len(leaked))
    feature_children = [row["child"] for row in features]
    print("feature rows matching file paths", sum(a == b for a, b in zip(feature_children, paths)))

    print("\nLabel vs image size (from file table, originals are not on disk):")
    corr(labels, heights, "height")
    corr(labels, widths, "width")
    corr(labels, widths / np.maximum(heights, 1), "aspect w/h")
    corr(labels, heights * widths, "area")

    arrays = {}
    for split in ("train", "val", "test"):
        x = np.load(NPZ / f"X_{split}.npy", mmap_mode="r")
        y = np.load(NPZ / f"y_{split}.npy")
        arrays[split] = (x, y)
        print(f"\nX_{split}", tuple(x.shape), x.dtype, "range", float(np.min(x)), float(np.max(x)))
        print(f"y_{split}", tuple(y.shape), "0", int((y == 0).sum()), "1", int((y == 1).sum()))
    train_n = int((splits == "train").sum())
    print("\ntrain arrays / train originals", arrays["train"][0].shape[0], "/", train_n, "=", arrays["train"][0].shape[0] / train_n)
    print("val arrays == val originals", arrays["val"][0].shape[0] == int((splits == "val").sum()))
    print("test arrays == test originals", arrays["test"][0].shape[0] == int((splits == "test").sum()))

    def mean_image(x: np.ndarray) -> np.ndarray:
        return np.asarray(x, dtype=np.float32).mean(axis=(1, 2, 3))

    print("\nLabel vs stored-array brightness (1 = whiter / less ink after preprocessing):")
    for split, (x, y) in arrays.items():
        corr(y.astype(int), mean_image(x), f"{split} mean pixel")

    def signatures(x: np.ndarray) -> np.ndarray:
        small = np.asarray(x[:, ::8, ::8, 0], dtype=np.float32)
        return small.reshape(small.shape[0], -1)

    train_sig = signatures(arrays["train"][0])
    print("\nClosest train match for each val/test image (mean absolute difference on an 8x downsampled view):")
    for split in ("val", "test"):
        sig = signatures(arrays[split][0])
        nearest = []
        exact = 0
        for row in sig:
            diff = np.mean(np.abs(train_sig - row), axis=1)
            nearest.append(float(diff.min()))
            if diff.min() == 0:
                exact += 1
        nearest = np.array(nearest)
        print(f"  {split}: exact copies in train={exact}  nearest min/median/max={nearest.min():.4f}/{np.median(nearest):.4f}/{nearest.max():.4f}")


if __name__ == "__main__":
    main()
