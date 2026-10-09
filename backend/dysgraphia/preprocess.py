"""Handwriting preprocessing taken from models/Dysgraphia/DysgraphiaModule.ipynb.

The notebook cell is the source. Do not change the order or the constants:
grayscale, dark ink on white, crop to ink, aspect-ratio resize onto a white
128x384 canvas, CLAHE, then scale to [0, 1].
"""
from __future__ import annotations

import numpy as np

IMG_H = 128
IMG_W = 384
CROP_PAD = 10
CLAHE_CLIP = 2.0
CLAHE_TILE = (8, 8)

PREPROCESS_CONFIG = {
    "source": "models/Dysgraphia/DysgraphiaModule.ipynb",
    "steps": [
        "grayscale",
        "ensure_dark_ink_on_white",
        "crop_to_ink",
        "resize_keep_aspect",
        "clahe",
        "scale_0_1",
    ],
    "img_h": IMG_H,
    "img_w": IMG_W,
    "crop_pad": CROP_PAD,
    "clahe_clip_limit": CLAHE_CLIP,
    "clahe_tile_grid": list(CLAHE_TILE),
    "resize_interpolation": "INTER_AREA",
    "canvas_fill": 255,
    "normalization": "divide_by_255",
}


def _cv2():
    import cv2

    return cv2


def decode_gray(data: bytes) -> np.ndarray | None:
    """Match the notebook's read_gray: imdecode with IMREAD_GRAYSCALE."""
    cv2 = _cv2()
    buf = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(buf, cv2.IMREAD_GRAYSCALE)
    if image is None:
        return None
    return image


def ensure_dark_ink_on_white(gray: np.ndarray) -> np.ndarray:
    return 255 - gray if gray.mean() < 127 else gray


def crop_to_ink(gray: np.ndarray, pad: int = CROP_PAD) -> np.ndarray:
    cv2 = _cv2()
    _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    pts = cv2.findNonZero(bw)
    if pts is None:
        return gray
    x, y, w, h = cv2.boundingRect(pts)
    height, width = gray.shape
    return gray[max(0, y - pad) : min(height, y + h + pad), max(0, x - pad) : min(width, x + w + pad)]


def resize_keep_aspect(gray: np.ndarray, out_h: int = IMG_H, out_w: int = IMG_W, fill: int = 255) -> np.ndarray:
    cv2 = _cv2()
    h, w = gray.shape
    scale = min(out_h / h, out_w / w)
    nh, nw = max(1, int(round(h * scale))), max(1, int(round(w * scale)))
    resized = cv2.resize(gray, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = np.full((out_h, out_w), fill, np.uint8)
    y0, x0 = (out_h - nh) // 2, (out_w - nw) // 2
    canvas[y0 : y0 + nh, x0 : x0 + nw] = resized
    return canvas


def preprocess_gray(gray: np.ndarray) -> np.ndarray:
    """Return float32 image shaped (128, 384, 1), values in [0, 1]."""
    cv2 = _cv2()
    if gray.ndim == 3:
        gray = cv2.cvtColor(gray, cv2.COLOR_BGR2GRAY)
    gray = ensure_dark_ink_on_white(gray)
    cropped = crop_to_ink(gray)
    canvas = resize_keep_aspect(cropped)
    clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP, tileGridSize=CLAHE_TILE)
    equalized = clahe.apply(canvas)
    out = equalized.astype(np.float32) / 255.0
    return out[..., None]


def preprocess_bytes(data: bytes) -> np.ndarray | None:
    gray = decode_gray(data)
    if gray is None:
        return None
    return preprocess_gray(gray)


def ink_was_found(gray: np.ndarray) -> bool:
    cv2 = _cv2()
    prepared = ensure_dark_ink_on_white(gray)
    _, bw = cv2.threshold(prepared, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    return cv2.findNonZero(bw) is not None
