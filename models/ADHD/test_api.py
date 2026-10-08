import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from fastapi.testclient import TestClient
from app import FEATURES, META, MODEL, QUESTIONS, THRESHOLD, app

client = TestClient(app)

def sample_answers():
    values = {}
    for key in FEATURES:
        values[key] = 9 if key == 'sc_age_years' else list(QUESTIONS[key]['options'].values())[0]
    return values

def test_health():
    assert client.get('/health').json()['status'] == 'ok'

def test_questions():
    r=client.get('/api/adhd/questions')
    assert r.status_code == 200
    assert len(r.json()['questions']) == 20

def test_predict_valid():
    r=client.post('/api/adhd/predict', json={'answers':sample_answers()})
    assert r.status_code==200, r.text
    data=r.json()
    assert 0 <= data['model_score'] <= 1
    assert type(data['screen_positive']) is bool
    assert len(data['top_factors']) == 5

def test_predict_invalid_code():
    vals=sample_answers();vals['k7q70_r']=99
    r=client.post('/api/adhd/predict', json={'answers':vals})
    assert r.status_code==422

def test_predict_missing():
    vals=sample_answers();del vals['memorycond']
    r=client.post('/api/adhd/predict', json={'answers':vals})
    assert r.status_code==422

def test_predict_wrong_age():
    vals=sample_answers();vals['sc_age_years']=12
    r=client.post('/api/adhd/predict', json={'answers':vals})
    assert r.status_code==422

def test_predict_extra_feature():
    vals=sample_answers();vals['k2q31a']=1
    r=client.post('/api/adhd/predict', json={'answers':vals})
    assert r.status_code==422


def test_predict_reject_string_codes():
    vals=sample_answers(); vals['memorycond']="1"
    r=client.post('/api/adhd/predict',json={'answers':vals})
    assert r.status_code==422

def test_predict_reject_boolean_codes():
    vals=sample_answers(); vals['memorycond']=True
    r=client.post('/api/adhd/predict',json={'answers':vals})
    assert r.status_code==422

def test_predict_reject_float_codes():
    vals=sample_answers(); vals['hoursleep']=8.5
    r=client.post('/api/adhd/predict', json={'answers':vals})
    assert r.status_code==422

def test_predict_nineteen_fields():
    vals=sample_answers()
    del vals['k7q32']
    r=client.post('/api/adhd/predict', json={'answers':vals})
    assert r.status_code==422
    assert 'k7q32' in r.text

def test_model_feature_order_and_threshold():
    assert list(MODEL.feature_names_) == FEATURES
    assert list(MODEL.feature_names_) == META['features']
    assert THRESHOLD == float(META['threshold'])
    assert THRESHOLD != 0.5
    assert set(QUESTIONS) == set(FEATURES)

def test_frontend_contract_matches_schema():
    frontend = json.loads((HERE / 'adhd_caregiver_questions_frontend.json').read_text(encoding='utf-8'))
    questions = frontend['questions']
    assert [item['feature_key'] for item in questions] == FEATURES
    assert len(questions) == 20
    for item in questions:
        codes = [option['value'] for option in item['options']]
        spec = QUESTIONS[item['feature_key']]
        allowed = spec['allowed'] if item['feature_key'] == 'sc_age_years' else list(spec['options'].values())
        assert codes == allowed

def test_response_language():
    r=client.post('/api/adhd/predict', json={'answers':sample_answers()})
    data=r.json()
    text=f"{data['message']} {data['disclaimer']}".lower()
    assert 'diagnos' not in data['message'].lower() or 'not a diagnosis' in data['disclaimer'].lower()
    assert 'not a diagnosis' in data['disclaimer'].lower()
    assert data['screen_positive'] in (True, False)
    assert 'model_score' in data
