import sys,os,wave,io
from pathlib import Path
import numpy as np
from fastapi.testclient import TestClient
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'api'))
from dyslexia_core import FEATURES, SAMPLE_RATE, WIN_SECONDS, extract_features_from_excerpt, leave_one_out, calc_metrics, choose_window
from app import app

client=TestClient(app)

def test_fixed_feature_schema():
    y=np.zeros(int(SAMPLE_RATE*WIN_SECONDS),dtype=np.float32)
    f=extract_features_from_excerpt(y)
    assert list(f)==FEATURES
    assert all(np.isfinite(list(f.values())))

def test_window_exact_length():
    y=np.random.default_rng(3).normal(0,.05,3*SAMPLE_RATE).astype(np.float32)
    f=np.ones(100,dtype=bool)
    w,start=choose_window(y,f)
    assert len(w)==int(SAMPLE_RATE*WIN_SECONDS)
    assert start>=0

def test_loo_all_have_predictions():
    X=np.array([[1],[2],[3],[4],[7],[8]],dtype=float)
    y=np.array([1,1,1,1,0,0])
    probs=leave_one_out(X,y)
    assert len(probs)==len(y)
    assert np.all((0<=probs)&(probs<=1))
    assert calc_metrics(y,probs)['sensitivity_95pct_CI'][0] is not None

def test_api_health():
    x=client.get('/api/dyslexia/health')
    assert x.status_code==200
    assert x.json()['screening_validated'] is False

def test_api_refuses_non_audio():
    r=client.post('/api/dyslexia/analyze',files={'file':('file.txt',b'abc','text/plain')})
    assert r.status_code==415

def test_api_refuses_garbage_audio():
    r=client.post('/api/dyslexia/analyze',files={'file':('garbage.wav',b'nope','audio/wav')})
    assert r.status_code==422

def test_api_valid_wav_no_diagnosis():
    buf=io.BytesIO()
    y=(.08*np.sin(np.arange(2*SAMPLE_RATE)*2*np.pi*220/SAMPLE_RATE)*32767).astype('<i2')
    with wave.open(buf,'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SAMPLE_RATE)
        w.writeframes(y.tobytes())
    r=client.post('/api/dyslexia/analyze',files={'file':('sample.wav',buf.getvalue(),'audio/wav')})
    assert r.status_code==200,r.text
    data=r.json()
    assert data['dyslexia_prediction_available'] is False
    assert 'research_audio_features' in data
