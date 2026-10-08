import io
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "api"))
from app import app
from dyslexia_core import SAMPLE_RATE

client = TestClient(app)
FORBIDDEN = ("risk", "probability", "diagnosis", "label", "screen_positive", "model_score")


def _wav(seconds=2.0):
    buf = io.BytesIO()
    count = int(SAMPLE_RATE * seconds)
    samples = (0.08 * np.sin(np.arange(count) * 2 * np.pi * 220 / SAMPLE_RATE) * 32767).astype("<i2")
    with wave.open(buf, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(samples.tobytes())
    return buf.getvalue()


def test_health_and_info():
    health = client.get("/api/dyslexia/health")
    assert health.status_code == 200
    assert health.json()["screening_validated"] is False
    info = client.get("/api/dyslexia/info")
    assert info.status_code == 200
    assert info.json()["clinical_prediction_available"] is False


def test_valid_wav_has_no_diagnosis_keys():
    response = client.post("/api/dyslexia/analyze", files={"file": ("sample.wav", _wav(), "audio/wav")})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["dyslexia_prediction_available"] is False
    assert body["status"] == "audio_features_only"
    lowered = {key.lower() for key in body}
    assert not any(word in key for key in lowered for word in FORBIDDEN)


def test_rejects_bad_extension_oversize_and_empty():
    bad = client.post("/api/dyslexia/analyze", files={"file": ("notes.txt", b"abc", "text/plain")})
    assert bad.status_code == 415
    empty = client.post("/api/dyslexia/analyze", files={"file": ("empty.wav", b"", "audio/wav")})
    assert empty.status_code == 422
    huge = b"0" * (15 * 1024 * 1024 + 1)
    over = client.post("/api/dyslexia/analyze", files={"file": ("big.wav", huge, "audio/wav")})
    assert over.status_code == 413


def test_temp_file_removed_after_failure_and_success():
    folder = Path(tempfile.gettempdir())
    before = {path.name for path in folder.glob("tmp*.wav")}
    failed = client.post("/api/dyslexia/analyze", files={"file": ("bad.wav", b"not-audio", "audio/wav")})
    assert failed.status_code == 422
    ok = client.post("/api/dyslexia/analyze", files={"file": ("sample.wav", _wav(), "audio/wav")})
    assert ok.status_code == 200
    after = {path.name for path in folder.glob("tmp*.wav")}
    assert not (after - before)


def test_joblib_artifact_is_not_in_the_serving_tree():
    assert not list(ROOT.rglob("*.joblib"))
    core = (ROOT / "src" / "dyslexia_core.py").read_text(encoding="utf-8")
    api = (ROOT / "api" / "app.py").read_text(encoding="utf-8")
    assert "joblib.load" not in core
    assert "joblib" not in api
