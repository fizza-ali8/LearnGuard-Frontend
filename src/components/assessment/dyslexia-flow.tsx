"use client";

import { ANALYSIS_STEPS, AnalysisScreen, AssessmentStepper, ConsentRequired, StudentSummary, Waveform, formatClock, useUnsavedWarning } from "@/components/assessment/shared";
import { ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, ErrorState, PageHeader } from "@/components/ui/display";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/inputs";
import { ConfirmDialog } from "@/components/ui/overlay";
import { READING_PASSAGES } from "@/lib/constants";
import { formatFileSize } from "@/lib/format";
import { useStudent } from "@/hooks/use-student";
import { Mic, Pause, Play, Square, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Step = "instructions" | "audio" | "reading" | "review" | "analyze";

export function DyslexiaFlow({ studentId }: { studentId: string }) {
  const { student, runAssessment } = useStudent(studentId);
  const router = useRouter();
  const [step, setStep] = useState<Step>("instructions");
  const [mode, setMode] = useState<"record" | "upload">("record");
  const [recording, setRecording] = useState<"idle" | "recording" | "paused" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [passageGrade, setPassageGrade] = useState("");
  const [analysisError, setAnalysisError] = useState(false);
  const saving = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFile = useRef<File | null>(null);
  useUnsavedWarning(Boolean(audioUrl) && step !== "analyze");

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (!student) {
    return <ErrorState title="Student not found" description="Choose a student from the assessment list." action={<Link href="/assessment/new"><Button>Choose student</Button></Link>} />;
  }

  if (!student.consentVerified) return <ConsentRequired name={student.name} />;
  const passage = READING_PASSAGES[passageGrade || student.grade] ?? READING_PASSAGES["4"];
  const steps = ["Instructions", "Audio", "Reading/Text", "Review", "Result"];
  const current = step === "instructions" ? 0 : step === "audio" ? 1 : step === "reading" ? 2 : step === "review" ? 3 : 4;

  const startTimer = () => {
    timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
  };
  const stopTimer = () => {
    if (timer.current) window.clearInterval(timer.current);
  };

  const attachBlob = (blob: Blob, name: string) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioFile.current = blob instanceof File ? blob : new File([blob], name, { type: blob.type || "audio/wav" });
    setAudioUrl(URL.createObjectURL(blob));
    setFileName(name);
    setFileSize(blob.size);
    setRecording("done");
    setError("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        attachBlob(blob, "oral-reading.webm");
      };
      recorder.current = media;
      media.start();
      setSeconds(0);
      setRecording("recording");
      startTimer();
    } catch {
      setError("Microphone permission was denied. Upload a WAV, MP3 or M4A file, or use the sample recording.");
      toast.error("Microphone unavailable. Upload a file or use the sample recording.");
    }
  };

  const useSample = () => {
    const secondsSample = 12;
    const sampleRate = 8000;
    const length = sampleRate * secondsSample;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    const write = (offset: number, text: string) => {
      for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
    };
    write(0, "RIFF");
    view.setUint32(4, 36 + length, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true);
    view.setUint16(32, 1, true);
    view.setUint16(34, 8, true);
    write(36, "data");
    view.setUint32(40, length, true);
    attachBlob(new Blob([buffer], { type: "audio/wav" }), "demo-sample-reading.wav");
    setSeconds(secondsSample);
    toast.success("Sample recording added for demonstration");
  };

  const onUpload = (file?: File) => {
    if (!file) return;
    const allowed = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/webm"];
    const extensionOk = /\.(wav|mp3|m4a)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extensionOk) {
      setError("Upload a WAV, MP3 or M4A file.");
      toast.error("Upload failed. Use a WAV, MP3 or M4A file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("Audio files must be 25 MB or smaller.");
      toast.error("Upload failed. Audio files must be 25 MB or smaller.");
      return;
    }
    attachBlob(file, file.name);
    toast.success("Audio uploaded");
    const player = document.createElement("audio");
    player.src = URL.createObjectURL(file);
    player.onloadedmetadata = () => setSeconds(Math.round(player.duration || 0));
  };

  const analyze = async () => {
    if (saving.current) return;
    if (!audioUrl) {
      setStep("audio");
      setError("Add a recording before analysis.");
      return;
    }
    saving.current = true;
    setAnalysisError(false);
    try {
      const assessment = await runAssessment({
        studentId: student.id,
        type: "dyslexia",
        audioDurationSec: seconds,
        passageTitle: passage.title,
        passage: passage.text,
        transcriptAvailable: transcript.trim().length > 0,
        inputQuality: fileSize > 1000 ? "Good" : "Fair",
        file: audioFile.current ?? undefined,
      });
      toast.success("Assessment saved successfully");
      router.push(`/results/${assessment.id}`);
    } catch {
      saving.current = false;
      setAnalysisError(true);
      toast.error("We couldn’t complete this assessment. Your recording is still available.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Dyslexia Screening"
        subtitle="A guided oral-reading assessment."
        breadcrumb={<Breadcrumb items={[{ label: "Students", href: "/students" }, { label: student.name, href: `/students/${student.id}` }, { label: "Dyslexia Assessment" }]} />}
      />
      <StudentSummary name={student.name} code={student.code} grade={student.grade} />
      <AssessmentStepper steps={steps} current={current} />

      {step === "instructions" ? (
        <Card className="bg-primary-softer">
          <h2 className="text-lg font-semibold text-heading">Before you begin</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-body">
            <li>Use a quiet environment.</li>
            <li>Position the microphone at a comfortable distance.</li>
            <li>Ask the student to read naturally.</li>
            <li>Avoid correcting or assisting during reading.</li>
            <li>Ensure the selected passage is appropriate to grade level.</li>
          </ul>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => setLeaveOpen(true)}>Cancel</Button>
            <Button onClick={() => setStep("audio")}>Continue</Button>
          </div>
        </Card>
      ) : null}

      {step === "audio" ? (
        <Card className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex justify-center gap-2">
            <Button variant={mode === "record" ? "primary" : "secondary"} size="sm" onClick={() => setMode("record")}>Record</Button>
            <Button variant={mode === "upload" ? "primary" : "secondary"} size="sm" onClick={() => setMode("upload")}>Upload Existing Audio</Button>
          </div>
          {mode === "record" && recording !== "done" ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                <Mic className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-heading">{recording === "idle" ? "Ready to record" : "Recording"}</h2>
              <p className="mt-1 text-sm text-muted">Ask the student to begin reading when comfortable.</p>
              {recording !== "idle" ? (
                <>
                  <p className="mt-4 font-heading text-3xl font-bold text-heading">{formatClock(seconds)}</p>
                  <Waveform active={recording === "recording"} />
                </>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {recording === "idle" ? <Button onClick={startRecording}>Start Recording</Button> : null}
                {recording === "recording" ? (
                  <Button variant="secondary" onClick={() => { recorder.current?.pause(); stopTimer(); setRecording("paused"); }}>
                    <Pause className="h-4 w-4" /> Pause
                  </Button>
                ) : null}
                {recording === "paused" ? (
                  <Button variant="secondary" onClick={() => { recorder.current?.resume(); startTimer(); setRecording("recording"); }}>
                    <Play className="h-4 w-4" /> Resume
                  </Button>
                ) : null}
                {recording === "recording" || recording === "paused" ? (
                  <Button variant="destructive" onClick={() => { stopTimer(); recorder.current?.stop(); }}>
                    <Square className="h-4 w-4" /> Stop
                  </Button>
                ) : null}
                <Button variant="tertiary" onClick={useSample}>Use sample recording</Button>
              </div>
            </>
          ) : null}
          {mode === "upload" && recording !== "done" ? (
            <label
              className="mt-2 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-lavender-border bg-primary-softer px-6 py-12"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onUpload(event.dataTransfer.files?.[0]);
              }}
            >
              <Upload className="h-5 w-5 text-primary-dark" />
              <span className="mt-3 text-sm font-medium text-heading">Drop audio here or browse</span>
              <span className="mt-1 text-xs text-muted">WAV, MP3 or M4A · up to 25 MB</span>
              <input
                type="file"
                accept=".wav,.mp3,.m4a,audio/*"
                className="sr-only"
                onChange={(event) => onUpload(event.target.files?.[0])}
              />
            </label>
          ) : null}
          {recording === "done" ? (
            <div>
              <Waveform />
              <audio ref={audioRef} controls src={audioUrl} className="mx-auto mt-4 w-full" />
              <p className="mt-3 text-sm text-muted">{fileName} · {formatClock(seconds)} · {formatFileSize(fileSize || 12000)}</p>
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="secondary" onClick={() => { setRecording("idle"); setAudioUrl(""); setSeconds(0); }}>Re-record</Button>
                <Button onClick={() => setStep("reading")}>Continue</Button>
              </div>
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-risk-high">{error}</p> : null}
        </Card>
      ) : null}

      {step === "reading" ? (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium text-primary-dark">{passage.title}</p>
              <label className="text-xs text-muted">
                Reading task
                <Select className="mt-1 h-9" aria-label="Reading task" value={passageGrade || student.grade} onChange={(event) => setPassageGrade(event.target.value)}>
                  {Object.keys(READING_PASSAGES).map((grade) => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </Select>
              </label>
            </div>
            <p className="mt-4 text-lg leading-[1.7] text-heading">{passage.text}</p>
          </Card>
          <Card>
            <Field label="Original Reading Text" hint="The passage shown to the student.">
              <Textarea value={passage.text} readOnly />
            </Field>
            <div className="mt-4">
              <Field label="Observed / Transcribed Text" hint="Optional. Add this only if you noted what was read.">
                <Textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} />
              </Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep("audio")}>Back</Button>
              <Button onClick={() => setStep("review")}>Continue</Button>
            </div>
          </Card>
        </div>
      ) : null}

      {step === "review" ? (
        <Card className="max-w-2xl">
          <h2 className="text-lg font-semibold text-heading">Review</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Student</dt><dd className="font-medium text-heading">{student.name}</dd></div>
            <div><dt className="text-muted">Date</dt><dd className="font-medium text-heading">{new Date().toLocaleDateString()}</dd></div>
            <div><dt className="text-muted">Audio duration</dt><dd className="font-medium text-heading">{formatClock(seconds)}</dd></div>
            <div><dt className="text-muted">Passage used</dt><dd className="font-medium text-heading">{passage.title}</dd></div>
            <div><dt className="text-muted">Audio quality</dt><dd className="font-medium text-heading">{fileSize > 1000 ? "Good" : "Fair"}</dd></div>
            <div><dt className="text-muted">Transcript available</dt><dd className="font-medium text-heading">{transcript.trim() ? "Yes" : "No"}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep("audio")}>Edit audio</Button>
            <Button variant="secondary" onClick={() => setStep("reading")}>Edit passage</Button>
            <Button onClick={() => setStep("analyze")} disabled={!audioUrl}>Analyze Assessment</Button>
          </div>
          <ScreeningDisclaimer className="mt-4" />
        </Card>
      ) : null}

      {step === "analyze" && analysisError ? (
        <ErrorState
          title="We couldn’t complete this assessment."
          description="Your uploaded recording is still available. Please try the analysis again."
          action={<Button onClick={() => { saving.current = false; setAnalysisError(false); }}>Try Again</Button>}
        />
      ) : null}
      {step === "analyze" && !analysisError ? (
        <AnalysisScreen
          title="Analyzing assessment"
          steps={ANALYSIS_STEPS}
          onDone={analyze}
        />
      ) : null}

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave this assessment?"
        description="The recording will not be saved."
        confirmLabel="Leave"
        onConfirm={() => router.push(`/students/${student.id}`)}
      />
    </div>
  );
}
