"use client";

import { ANALYSIS_STEPS, AnalysisScreen, AssessmentStepper, ConsentRequired, StudentSummary, useUnsavedWarning } from "@/components/assessment/shared";
import { Button } from "@/components/ui/button";
import { Breadcrumb, Card, ErrorState, PageHeader } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useStudent } from "@/hooks/use-student";
import type { ImageQuality } from "@/types";
import { RotateCw, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

type Step = "instructions" | "upload" | "quality" | "review" | "analyze";

export function DysgraphiaFlow({ studentId }: { studentId: string }) {
  const { student, runAssessment } = useStudent(studentId);
  const router = useRouter();
  const [step, setStep] = useState<Step>("instructions");
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [rotation, setRotation] = useState(0);
  const [cropped, setCropped] = useState(false);
  const [quality, setQuality] = useState<ImageQuality | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const imageFile = useRef<File | null>(null);
  const [error, setError] = useState("");
  const [analysisError, setAnalysisError] = useState(false);
  const saving = useRef(false);
  useUnsavedWarning(Boolean(image) && step !== "analyze");

  if (!student) {
    return <ErrorState title="Student not found" description="Return to the student list and start again." action={<Link href="/students"><Button>Students</Button></Link>} />;
  }

  if (!student.consentVerified) return <ConsentRequired name={student.name} />;
  const current = ["instructions", "upload", "quality", "review", "analyze"].indexOf(step);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!/\.(png|jpe?g)$/i.test(file.name) && !["image/png", "image/jpeg"].includes(file.type)) {
      setError("Upload a PNG or JPEG image.");
      toast.error("Upload failed. Use a PNG or JPEG image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Images must be 10 MB or smaller.");
      toast.error("Upload failed. Images must be 10 MB or smaller.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const dims = await readSize(dataUrl);
    const small = dims.width < 480 || dims.height < 480;
    imageFile.current = file;
    setImage(dataUrl);
    setName(file.name);
    setError("");
    setQuality({
      writingDetected: dims.width > 80,
      resolution: small ? "poor" : dims.width < 900 ? "fair" : "good",
      contrast: small ? "poor" : "good",
      orientation: "correct",
      blur: file.size < 20000 ? "high" : "low",
      warning: small ? "This image may be hard to read. A clearer sample can improve screening reliability." : undefined,
    });
    toast.success("Handwriting sample uploaded");
  };

  const analyze = async () => {
    if (saving.current) return;
    if (!image) {
      setStep("upload");
      setError("Add a handwriting sample before analysis.");
      return;
    }
    saving.current = true;
    setAnalysisError(false);
    try {
      const assessment = await runAssessment({
        studentId: student.id,
        type: "dysgraphia",
        imageDataUrl: image,
        inputQuality: quality?.warning ? "Fair" : "Good",
        quality: quality ?? undefined,
        file: imageFile.current ?? undefined,
      });
      toast.success("Assessment saved successfully");
      router.push(`/results/${assessment.id}`);
    } catch {
      saving.current = false;
      setAnalysisError(true);
      toast.error("We couldn’t complete this assessment. Your image is still available.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Dysgraphia Screening"
        subtitle="Upload a handwriting sample and review its quality before analysis."
        breadcrumb={<Breadcrumb items={[{ label: "Students", href: "/students" }, { label: student.name, href: `/students/${student.id}` }, { label: "Dysgraphia Assessment" }]} />}
      />
      <StudentSummary name={student.name} code={student.code} grade={student.grade} />
      <AssessmentStepper steps={["Instructions", "Upload", "Quality Check", "Review", "Result"]} current={current} />

      {step === "instructions" ? (
        <Card className="bg-primary-softer">
          <h2 className="text-lg font-semibold text-heading">Use a clear handwriting sample</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-body">
            <li>Ensure the writing fills the frame.</li>
            <li>Avoid shadows or blur.</li>
            <li>Supported files: PNG, JPG, JPEG.</li>
          </ul>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => (image ? setLeaveOpen(true) : router.push(`/students/${student.id}`))}>Cancel</Button>
            <Button onClick={() => setStep("upload")}>Continue</Button>
          </div>
        </Card>
      ) : null}

      {step === "upload" ? (
        <Card>
          {!image ? (
            <label
              className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-lavender-border bg-primary-softer px-6 py-16 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void onFile(event.dataTransfer.files?.[0]);
              }}
            >
              <Upload className="h-5 w-5 text-primary-dark" />
              <span className="mt-3 text-sm font-medium text-heading">Drag a handwriting image here, or browse</span>
              <span className="mt-1 text-xs text-muted">PNG, JPG or JPEG</span>
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
            </label>
          ) : (
            <div>
              <div className={`mx-auto max-w-lg overflow-hidden rounded-xl border border-line bg-soft ${cropped ? "max-h-72" : ""}`}>
                {/* User-provided handwriting sample */}
                <img src={image} alt="Handwriting sample preview" className={`mx-auto max-h-[420px] ${cropped ? "scale-110 object-cover" : "object-contain"}`} style={{ transform: `rotate(${rotation}deg)` }} />
              </div>
              <p className="mt-3 text-sm text-muted">{name}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setRotation((value) => (value + 90) % 360)}><RotateCw className="h-4 w-4" /> Rotate</Button>
                <Button variant="secondary" onClick={() => setCropped((value) => !value)}>{cropped ? "Undo crop" : "Crop"}</Button>
                <Button variant="secondary" onClick={() => { setImage(""); setQuality(null); }}>Replace</Button>
                <Button variant="destructive" onClick={() => { setImage(""); setQuality(null); }}>Remove</Button>
                <Button onClick={() => setStep("quality")}>Continue</Button>
              </div>
            </div>
          )}
          {error ? <p className="mt-3 text-sm text-risk-high">{error}</p> : null}
        </Card>
      ) : null}

      {step === "quality" && quality ? (
        <Card className="max-w-xl">
          <h2 className="text-lg font-semibold text-heading">Sample Quality</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between"><span>Writing detected</span><span>{quality.writingDetected ? "Yes" : "No"}</span></li>
            <li className="flex justify-between"><span>Resolution</span><span className="capitalize">{quality.resolution}</span></li>
            <li className="flex justify-between"><span>Contrast</span><span className="capitalize">{quality.contrast}</span></li>
            <li className="flex justify-between"><span>Orientation</span><span className="capitalize">{quality.orientation}</span></li>
            <li className="flex justify-between"><span>Blur</span><span className="capitalize">{quality.blur}</span></li>
          </ul>
          {quality.warning ? <p className="mt-4 rounded-xl bg-risk-moderate-bg px-3 py-3 text-sm text-risk-moderate">{quality.warning}</p> : null}
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => setStep("upload")}>Back</Button>
            <Button onClick={() => setStep("review")}>Continue to Analysis</Button>
          </div>
        </Card>
      ) : null}

      {step === "review" ? (
        <Card className="max-w-xl">
          <h2 className="text-lg font-semibold text-heading">Review sample</h2>
          <p className="mt-2 text-sm text-muted">{student.name} · {name} · rotation {rotation}° {cropped ? "· cropped" : ""}</p>
          <p className="mt-3 text-sm leading-6 text-body">Quality is marked {quality?.warning ? "fair" : "good"}. The explanation view will highlight regions that influenced the screening output.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => setStep("upload")}>Replace image</Button>
            <Button variant="secondary" onClick={() => setStep("quality")}>Back</Button>
            <Button onClick={() => setStep("analyze")} disabled={!image}>Analyze Assessment</Button>
          </div>
        </Card>
      ) : null}

      {step === "analyze" && analysisError ? (
        <ErrorState
          title="We couldn’t complete this assessment."
          description="Your handwriting sample is still available. Please try the analysis again."
          action={<Button onClick={() => { saving.current = false; setAnalysisError(false); }}>Try Again</Button>}
        />
      ) : null}
      {step === "analyze" && !analysisError ? (
        <AnalysisScreen
          title="Analyzing handwriting"
          steps={ANALYSIS_STEPS}
          onDone={analyze}
        />
      ) : null}
      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave this assessment?"
        description="The handwriting sample will not be saved."
        confirmLabel="Leave"
        onConfirm={() => router.push(`/students/${student.id}`)}
      />
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(file);
  });
}

function readSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = src;
  });
}
