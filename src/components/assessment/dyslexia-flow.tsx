"use client";

import { ConsentRequired, StudentSummary } from "@/components/assessment/shared";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, ErrorState, PageHeader } from "@/components/ui/display";
import { useStudent } from "@/hooks/use-student";
import { formatFileSize } from "@/lib/format";
import {
  DYSLEXIA_ACTIVITY_LABEL,
  DYSLEXIA_DISCLAIMER,
  DYSLEXIA_EXTENSIONS,
  analyzeDyslexiaAudio,
  dyslexiaUploadError,
  qualityCheckText,
  type DyslexiaAudioAnalysis,
} from "@/lib/dyslexia-audio";
import { Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

type Phase = "idle" | "analysing" | "success" | "error";

export function DyslexiaFlow({ studentId }: { studentId: string }) {
  const { student, saveDyslexiaAudio } = useStudent(studentId);
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState("");
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<DyslexiaAudioAnalysis | null>(null);
  const [recordId, setRecordId] = useState("");
  const busy = useRef(false);

  if (!student) {
    return <ErrorState title="Student not found" description="Choose a student from the assessment list." action={<Link href="/assessment/new"><Button>Choose student</Button></Link>} />;
  }
  if (!student.consentVerified) return <ConsentRequired name={student.name} />;

  const chooseFile = (next?: File) => {
    if (!next) return;
    const problem = dyslexiaUploadError(next);
    if (problem) {
      setFile(null);
      setClientError(problem);
      setPhase("idle");
      return;
    }
    setFile(next);
    setClientError("");
    setServerError("");
    setResult(null);
    setPhase("idle");
  };

  const analyse = async () => {
    if (busy.current || !file) return;
    if (!consent) {
      setClientError("Confirm consent before the audio is analysed.");
      return;
    }
    const problem = dyslexiaUploadError(file);
    if (problem) {
      setClientError(problem);
      return;
    }
    busy.current = true;
    setPhase("analysing");
    setServerError("");
    try {
      const analysis = await analyzeDyslexiaAudio(file);
      const saved = await saveDyslexiaAudio({
        studentId: student.id,
        durationSeconds: analysis.durationSeconds,
        estimatedActivitySeconds: analysis.estimatedActivitySeconds,
        qualityFlags: analysis.qualityFlags,
      });
      setResult(analysis);
      setRecordId(saved.id);
      setFile(null);
      setPhase("success");
      toast.success("Audio analysis recorded");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong while analysing the audio.");
      setPhase("error");
    } finally {
      busy.current = false;
    }
  };

  return (
    <div>
      <PageHeader
        title="Dyslexia audio analysis"
        subtitle="Research audio check only. No risk score is produced."
        breadcrumb={<Breadcrumb items={[{ label: "Students", href: "/students" }, { label: student.name, href: `/students/${student.id}` }, { label: "Dyslexia audio analysis" }]} />}
      />
      <StudentSummary name={student.name} code={student.code} grade={student.grade} />

      {phase === "success" && result ? (
        <Card className="max-w-2xl">
          <h2 className="text-lg font-semibold text-heading">Audio check recorded</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Duration</dt>
              <dd className="font-medium text-heading">{result.durationSeconds.toFixed(2)} seconds</dd>
            </div>
            <div>
              <dt className="text-muted">{DYSLEXIA_ACTIVITY_LABEL}</dt>
              <dd className="font-medium text-heading">{result.estimatedActivitySeconds.toFixed(2)} seconds</dd>
            </div>
            <div>
              <dt className="text-muted">Quality check</dt>
              <dd className="font-medium text-heading">{qualityCheckText(result.qualityFlags)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-6 text-body">{DYSLEXIA_DISCLAIMER}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/results/${recordId}`}><Button>View record</Button></Link>
            <Button variant="secondary" onClick={() => { setResult(null); setRecordId(""); setConsent(false); setPhase("idle"); }}>
              Analyse another recording
            </Button>
          </div>
        </Card>
      ) : null}

      {phase === "analysing" ? (
        <div role="status" aria-live="polite">
          <Card className="max-w-2xl">
            <h2 className="text-lg font-semibold text-heading">Analysing audio…</h2>
            <p className="mt-2 text-sm leading-6 text-muted">The recording stays on this computer and is not stored after the check finishes.</p>
          </Card>
        </div>
      ) : null}

      {phase === "idle" || phase === "error" ? (
        <Card className="max-w-2xl">
          <label className="flex items-start gap-3 text-sm leading-6 text-body">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-label="Consent for research audio analysis"
            />
            <span>I confirm this recording may be analysed for research audio features only. This is not a dyslexia screening result.</span>
          </label>
          <label
            className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-lavender-border bg-primary-softer px-6 py-12 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files?.[0]);
            }}
          >
            <Upload className="h-5 w-5 text-primary-dark" />
            <span className="mt-3 text-sm font-medium text-heading">Drop audio here or browse</span>
            <span className="mt-1 text-xs text-muted">MP4, M4A, WAV, MP3, OGG, FLAC, or AAC · up to 15 MB</span>
            <input
              type="file"
              accept={DYSLEXIA_EXTENSIONS.join(",")}
              className="sr-only"
              aria-label="Upload audio"
              onChange={(event) => {
                chooseFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {file ? <p className="mt-3 text-sm text-muted">{file.name} · {formatFileSize(file.size)}</p> : null}
          {clientError ? <p className="mt-3 text-sm text-risk-high" role="alert">{clientError}</p> : null}
          {serverError ? <p className="mt-3 text-sm text-risk-high" role="alert">{serverError}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={analyse} disabled={!consent || !file}>
              {phase === "error" ? "Try again" : "Analyse audio"}
            </Button>
            <Button variant="secondary" onClick={() => router.push(`/students/${student.id}`)}>Cancel</Button>
          </div>
          <p className="mt-4 text-sm leading-6 text-body">{DYSLEXIA_DISCLAIMER}</p>
        </Card>
      ) : null}
    </div>
  );
}
