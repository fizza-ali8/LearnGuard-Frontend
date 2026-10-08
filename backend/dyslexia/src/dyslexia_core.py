"""LearnGuard dyslexia pilot: acoustic analysis and research-only experiment.

Not a clinical dyslexia detector. No normative reading-speed or word-error rate
without passage text, transcripts, task details, and age information.
"""
from __future__ import annotations
import csv, hashlib, json, os, re, subprocess, zipfile
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.signal import stft, butter, sosfilt, find_peaks
from scipy.fft import dct
from scipy.stats import beta
from sklearn.base import clone
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import accuracy_score, balanced_accuracy_score, precision_score, recall_score, confusion_matrix, roc_auc_score, average_precision_score
import joblib

SAMPLE_RATE=16000
WIN_SECONDS=1.5  # All examples matched; shortest control ~2.07 seconds
FEATURES=[f'mfcc_{i}_{stat}' for stat in ('mean','std') for i in range(2,6)]
AUDIO_SUFFIXES={'.wav','.mp3','.mp4','.m4a','.aac','.ogg','.flac'}
RANDOM_SEED=42


def safe_unzip(zip_path, dest):
    dest=Path(dest).resolve();dest.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(zip_path) as src:
        for f in src.infolist():
            target=(dest/f.filename).resolve()
            if not target.is_relative_to(dest):
                raise ValueError('Unsafe path in zip')
            if f.is_dir():target.mkdir(parents=True,exist_ok=True);continue
            if Path(f.filename).suffix.lower() not in AUDIO_SUFFIXES:continue
            target.parent.mkdir(parents=True,exist_ok=True)
            with src.open(f) as inp,open(target,'wb') as out:
                import shutil;shutil.copyfileobj(inp,out)
    return dest


def discover_audios(folder):
    items=[]
    for f in sorted(Path(folder).rglob('*')):
        if not f.is_file() or f.suffix.lower() not in AUDIO_SUFFIXES:continue
        name=f.name
        if re.fullmatch(r'a(?:[1-9]|1[0-2])\.(?:mp4|m4a|wav|mp3)',name,re.I):
            label=1
        elif re.fullmatch(r'New Recording (?:36|37|38)\.m4a(?:\.mp4)?',name,re.I):
            label=0
        else:continue
        items.append({'filename':name,'path':str(f),'label':label,'participant_id':'',
           'participant_verified':False,'age':'','passage_id':'','language':'',
           'consent_verified':False})
    if len(items)!=15 or sum(x['label']==1 for x in items)!=12:
        raise ValueError(f'Expected 12 dyslexic and 3 control audios; found {len(items)} with {sum(x["label"]==1 for x in items)} positive')
    return items


def decode_audio(path, sr=SAMPLE_RATE, max_duration=240):
    # ffmpeg is standard on Colab; s16le limits memory, no local permanent raw data.
    cmd=['ffmpeg','-nostdin','-v','error','-i',str(path),'-vn','-ac','1','-ar',str(sr),
         '-t',str(max_duration),'-f','s16le','-acodec','pcm_s16le','pipe:1']
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=90)
    if p.returncode!=0:raise RuntimeError(f'ffmpeg decode failed: {Path(path).name}: {p.stderr[:300].decode(errors="ignore")}')
    y=np.frombuffer(p.stdout,dtype='<i2').astype(np.float32)/32768.
    if len(y)<int(sr*0.4):raise ValueError('Audio shorter than 0.4 seconds')
    return y


def voice_activity(y,sr=SAMPLE_RATE):
    try:
        import webrtcvad
        vad=webrtcvad.Vad(2);s=(np.clip(y,-1,1)*32767).astype('<i2')
        n=int(sr*.03); flags=[vad.is_speech(s[i:i+n].tobytes(),sr) for i in range(0,len(s)-n+1,n)]
        flags=np.asarray(flags,dtype=bool)
        return flags,'webrtcvad_30ms_mode2'
    except (ImportError,ValueError):
        # Not a speech detector; voice estimates must be treated as energy activity.
        n=int(sr*.03);frames=np.asarray([y[i:i+n] for i in range(0,len(y)-n+1,n)])
        en=np.sqrt(np.mean(frames**2,axis=1)+1e-12)
        return en>max(float(np.percentile(en,20)*2.5),.005),'energy_proxy_not_speech'


def longest_run_negative(binary,step=.03):
    mx=0;v=0
    for b in binary:
        if b:v=0
        else:v+=1;mx=max(mx,v)
    return round(mx*step,3)


def choose_window(y, flags, win=WIN_SECONDS, sr=SAMPLE_RATE):
    # Select a voiced 1.5 second excerpt without using full recording length
    # as a direct classification feature. Does not ensure it is reading.
    size=int(win*sr)
    if len(y)<size:raise ValueError('Recording too short for matched analysis')
    k=max(1,round(win/.03));
    # sliding voice-presence total; energy breaks ties deterministically
    if len(flags)<k:
        start=0
    else:
        vf=flags.astype(np.float32)
        counts=np.convolve(vf,np.ones(k,dtype=np.float32),'valid')
        cand=np.where(counts>=max(counts)-1e-6)[0]
        if len(cand)>1:
            energy=np.array([np.mean(y[int(i*.03*sr):int(i*.03*sr)+size]**2) for i in cand])
            idx=int(cand[np.argmax(energy)])
        else: idx=int(cand[0])
        start=min(idx*int(.03*sr),len(y)-size)
    return y[start:start+size].copy(),start/sr


def mel_filters(nfft=512,sr=SAMPLE_RATE,nmels=26):
    hz2mel=lambda hz:2595*np.log10(1+hz/700)
    mel2hz=lambda mel:700*(10**(mel/2595)-1)
    fmin=60.;fmax=min(7600.,sr/2)
    mel=np.linspace(hz2mel(fmin),hz2mel(fmax),nmels+2)
    bins=np.floor((nfft+1)*mel2hz(mel)/sr).astype(int)
    weights=np.zeros((nmels,nfft//2+1),dtype=np.float64)
    for j in range(nmels):
        lo,mid,hi=bins[j:j+3];lo=max(0,lo);hi=min(nfft//2+1,hi)
        for k in range(lo,mid):weights[j,k]=(k-lo)/max(1,mid-lo)
        for k in range(mid,hi):weights[j,k]=(hi-k)/max(1,hi-mid)
    return weights


def extract_features_from_excerpt(y):
    if len(y)!=round(SAMPLE_RATE*WIN_SECONDS):raise ValueError('Expected fixed-length analysis window')
    # Standardize amplitude without changing spectral shape; avoid phone gain as feature.
    y=np.nan_to_num(y).astype(float)
    y=y/max(np.sqrt(np.mean(y*y)),1e-5)*.06
    sos=butter(2,80,btype='highpass',fs=SAMPLE_RATE,output='sos')
    y=sosfilt(sos,y)
    _,_,z=stft(y,SAMPLE_RATE,nperseg=400,noverlap=240,nfft=512,boundary=None,padded=False)
    power=np.abs(z)**2
    mel=mel_filters()@power
    coeff=dct(np.log(mel+1e-9),type=2,axis=0,norm='ortho')
    feats={}
    for i in range(2,6):feats[f'mfcc_{i}_mean']=float(np.mean(coeff[i]))
    for i in range(2,6):feats[f'mfcc_{i}_std']=float(np.std(coeff[i]))
    return feats


def audit_record(record):
    y=decode_audio(record['path']);flags,method=voice_activity(y)
    dur=len(y)/SAMPLE_RATE;clip=np.mean(np.abs(y)>=.99);rms=np.sqrt(np.mean(y*y))
    crop,sec=choose_window(y,flags)
    record_out={k:v for k,v in record.items() if k!='path'}
    record_out.update({'sha256':hashlib.sha256(Path(record['path']).read_bytes()).hexdigest(),
       'duration_sec':round(dur,3),'rms_dbfs':round(float(20*np.log10(rms+1e-10)),2),
       'clipping_fraction':float(clip),'estimated_activity_sec':round(float(flags.sum()*.03),2),
       'estimated_activity_fraction':round(float(flags.mean()),3),
       'activity_method':method,'longest_inactive_gap_sec':longest_run_negative(flags),
       'matched_window_start_sec':round(sec,3),
       'quality_warning':('very_short_recording' if dur<10 else 'short_recording' if dur<20 else '')})
    return record_out,extract_features_from_excerpt(crop),y,crop


def make_pipeline():
    return Pipeline([('imputer',SimpleImputer(strategy='median')),
                     ('scaler',StandardScaler()),
                     ('classifier',LogisticRegression(C=0.1,class_weight='balanced',max_iter=1000,random_state=RANDOM_SEED))])


def leave_one_out(X,y,model=None):
    if model is None:model=make_pipeline()
    y=np.asarray(y).astype(int)
    probs=np.zeros(len(y),dtype=float)
    for tr,te in LeaveOneOut().split(X):
        model_fold=clone(model);model_fold.fit(X[tr],y[tr]);probs[te]=model_fold.predict_proba(X[te])[:,1]
    return probs


def exact_ci(k,n,alpha=.05):
    if n==0:return [None,None]
    return [round(float(beta.ppf(alpha/2,k,n-k+1)) if k else 0,4),
            round(float(beta.ppf(1-alpha/2,k+1,n-k)) if k<n else 1,4)]


def calc_metrics(y,p):
    y=np.asarray(y).astype(int);p=np.asarray(p)
    pred=(p>=.5).astype(int)
    tn,fp,fn,tp=confusion_matrix(y,pred,labels=[0,1]).ravel()
    return {'accuracy':float(accuracy_score(y,pred)),
            'balanced_accuracy':float(balanced_accuracy_score(y,pred)),
            'sensitivity':float(tp/(tp+fn)) if tp+fn else None,
            'specificity':float(tn/(tn+fp)) if tn+fp else None,
            'sensitivity_95pct_CI':exact_ci(tp,tp+fn),
            'specificity_95pct_CI':exact_ci(tn,tn+fp),
            'precision':float(precision_score(y,pred,zero_division=0)),
            'roc_auc':float(roc_auc_score(y,p)) if len(set(y))==2 else None,
            'pr_auc':float(average_precision_score(y,p)) if len(set(y))==2 else None,
            'confusion_matrix':{'TN':int(tn),'FP':int(fp),'FN':int(fn),'TP':int(tp)}}


def run_pipeline(input_dir,output_dir,permutations=99):
    out=Path(output_dir);(out/'results').mkdir(parents=True,exist_ok=True)
    (out/'artifacts').mkdir(parents=True,exist_ok=True)
    records=discover_audios(input_dir)
    audits=[];features=[]
    for r in records:
        a,f,_,_=audit_record(r);audits.append(a);features.append(f)
    audit=pd.DataFrame(audits);features=pd.DataFrame(features)[FEATURES]
    full=pd.concat([audit,features],axis=1)
    audit.to_csv(out/'results'/'audio_quality_audit.csv',index=False)
    full.to_csv(out/'results'/'audio_features_and_metadata.csv',index=False)
    if audit['sha256'].duplicated().any():raise RuntimeError('Exact duplicate recording found; investigate before CV')
    X=features.to_numpy(dtype=float);y=audit.label.to_numpy(dtype=int)
    p=leave_one_out(X,y)
    # Diagnostic: unbalanced 12/3 dataset + duration only can fake useful classification
    duration_proba=leave_one_out(np.log1p(audit[['duration_sec']].to_numpy()),y)
    metrics=calc_metrics(y,p)
    duration_metrics=calc_metrics(y,duration_proba)
    majority_pred=np.ones(len(y),dtype=int)
    majority={'accuracy':float(np.mean(majority_pred==y)),
              'balanced_accuracy':0.5,'sensitivity':1.0,'specificity':0.0}
    cv=audit[['filename','label','duration_sec']].copy()
    cv['mfcc_loocv_score_experimental']=p
    cv['mfcc_loocv_prediction_experimental']=(p>=.5).astype(int)
    cv['duration_only_loocv_score']=duration_proba
    cv['duration_only_prediction']=(duration_proba>=.5).astype(int)
    cv.to_csv(out/'results'/'leave_one_recording_out_predictions.csv',index=False)
    # Label permutation is merely an exploratory sanity check, not proof of validity.
    null=[]
    rng=np.random.default_rng(RANDOM_SEED)
    for i in range(permutations):
        yp=rng.permutation(y)
        q=leave_one_out(X,yp)
        null.append(float(balanced_accuracy_score(yp,q>=.5)))
    actual=metrics['balanced_accuracy']
    pval=(1+sum(v>=actual for v in null))/(1+len(null))
    pd.DataFrame({'permuted_balanced_accuracy':null}).to_csv(out/'results'/'permutation_null.csv',index=False)
    fitted=make_pipeline().fit(X,y)
    bundle={'pipeline':fitted,'features':FEATURES,'sample_rate':SAMPLE_RATE,
            'excerpt_seconds':WIN_SECONDS,'threshold':.5,'status':'research_only_no_clinical_validation',
            'trained_on_n':len(y),'training_positive_n':int(y.sum()),
            'training_control_n':int(len(y)-sum(y)),
            'allow_clinical_predictions':False}
    joblib.dump(bundle,out/'artifacts'/'pilot_mfcc_logreg.joblib')
    # Metadata is safe to use in reports; do not export individual private audio bytes.
    summary={'dataset':{'total':int(len(y)),'reported_dyslexic':int(sum(y)),
                        'reported_control':int(len(y)-sum(y)),
                        'participant_ids_verified':False,
                        'age_known':False,'passage_known':False,
                        'very_short_controls':int(((audit.label==0)&(audit.duration_sec<5)).sum())},
            'protocol':{'model':'class_balanced_regularized_logistic_regression',
                        'features':FEATURES,'matched_excerpt_seconds':WIN_SECONDS,
                        'evaluation':'leave_one_recording_out_no_unseen_holdout',
                        'split_group':'recording_not_verified_child',
                        'threshold':.5,'training_fold_only_scaling':True,
                        'model_selection':'none_fixed_before_evaluation',
                        'no_model_should_be_used_to_screen_children':True},
            'pilot_mfcc_model':metrics,'duration_only_control':duration_metrics,
            'majority_class_baseline':majority,
            'exploratory_label_permutation_p':round(float(pval),4),
            'permutations':len(null),
            'deployment':'analysis_only; do not display a dyslexia risk score or binary diagnosis in child-facing UI',
            'limitations':['three control recordings are only 2-5 seconds',
             'no passage, transcript, age, language, or verified participant IDs',
             'device, task, and recording length may correlate with label',
             'only three independent controls at best; specificity is very uncertain',
             'same-person recording groups not verified; this is not subject-level CV',
             'no external, prospective or clinical validation']}
    (out/'results'/'pilot_evaluation.json').write_text(json.dumps(summary,indent=2,allow_nan=False),encoding='utf-8')
    (out/'artifacts'/'feature_schema.json').write_text(json.dumps({
       'features':FEATURES,'sample_rate':SAMPLE_RATE,'excerpt_seconds':WIN_SECONDS,
       'policy':'acoustic research only, not clinical screening',
       'expected_audio_formats':sorted(AUDIO_SUFFIXES)},indent=2))
    return summary


def analyze_one_audio(path):
    row,feats,_,_=audit_record({'filename':Path(path).name,'path':str(path),'label':-1,
        'participant_id':'','participant_verified':False,'age':'','passage_id':'','language':'',
        'consent_verified':False})
    return {'status':'audio_features_only',
        'duration_seconds':row['duration_sec'],'estimated_activity_seconds':row['estimated_activity_sec'],
        'activity_is_not_verified_speech':True,'quality_flags':([row['quality_warning']] if row['quality_warning'] else []),
        'research_audio_features':feats,
        'dyslexia_prediction_available':False,
        'message':'Insufficient independent control data and unknown reading protocol: no clinical dyslexia result.'}
