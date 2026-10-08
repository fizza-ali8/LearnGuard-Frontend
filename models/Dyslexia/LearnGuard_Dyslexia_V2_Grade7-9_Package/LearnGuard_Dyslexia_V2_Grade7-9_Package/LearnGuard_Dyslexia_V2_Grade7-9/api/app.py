"""LearnGuard dyslexia audio analysis API (research-only, no diagnosis)."""
import os,sys,tempfile
from pathlib import Path
from fastapi import FastAPI,File,HTTPException,UploadFile
from fastapi.middleware.cors import CORSMiddleware
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from dyslexia_core import analyze_one_audio

app=FastAPI(title='LearnGuard Dyslexia Acoustic Pilot',version='2.0.0',
            description='Acoustic analysis only; no clinical dyslexia diagnosis or risk assessment.')
origins=[x.strip() for x in os.environ.get('LEARNGUARD_ALLOWED_ORIGINS','http://localhost:3000,http://localhost:5173').split(',') if x.strip()]
app.add_middleware(CORSMiddleware,allow_origins=origins,allow_methods=['GET','POST'],allow_headers=['Content-Type'])
ALLOWED={'.mp4','.m4a','.wav','.mp3','.ogg','.flac','.aac'}
MAX_BYTES=15*1024*1024

@app.get('/api/dyslexia/health')
def health():
    return {'status':'ok','model_mode':'audio_features_only','screening_validated':False}

@app.get('/api/dyslexia/info')
def info():
    return {'clinical_prediction_available':False,'supported_formats':sorted(ALLOWED),
       'disclaimer':'This experimental acoustic analysis cannot diagnose or rule out dyslexia. No clinically validated threshold is available.',
       'limitations':['pilot data: 12 labelled dyslexic, 3 extremely short controls',
                      'no passage text or age metadata','no external validation']}

@app.post('/api/dyslexia/analyze')
async def analyze(file:UploadFile=File(...)):
    name=Path(file.filename or '').name
    ext=Path(name).suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(status_code=415,detail='Unsupported audio format')
    buf=await file.read(MAX_BYTES+1)
    if len(buf)>MAX_BYTES:
        raise HTTPException(status_code=413,detail='Audio file exceeds 15 MB limit')
    if not buf:
        raise HTTPException(status_code=422,detail='Empty audio file')
    tmp=None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext,delete=False) as f:
            f.write(buf);tmp=f.name
        result=analyze_one_audio(tmp)
        return result
    except Exception:
        raise HTTPException(status_code=422,detail='Could not decode or analyze audio. Check file encoding and recording length.')
    finally:
        if tmp:
            Path(tmp).unlink(missing_ok=True)
