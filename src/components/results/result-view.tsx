"use client";

import { ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Accordion, Breadcrumb, Card, DemoBadge, ErrorState, PageHeader, Tabs } from "@/components/ui/display";
import { RiskBadge, RiskBar, RiskGauge } from "@/components/ui/risk";
import { PRODUCT } from "@/lib/constants";
import { formatDate, formatDuration } from "@/lib/format";
import { adhdScreenStatus, featureLabel } from "@/data/adhd-questionnaire";
import { moduleFullLabel } from "@/lib/risk";
import { usePreferences } from "@/providers/preferences-provider";
import { useData } from "@/providers/data-provider";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ResultView({ assessmentId }: { assessmentId: string }) {
  const { assessments, students, createReport } = useData();
  const { preferences } = usePreferences();
  const router = useRouter();
  const assessment = assessments.find((item) => item.id === assessmentId);
  const student = students.find((item) => item.id === assessment?.studentId);
  const [view, setView] = useState("original");
  const [reporting, setReporting] = useState(false);

  if (!assessment || !student) {
    return <ErrorState title="We couldn’t open this result." description="The assessment may have been removed from this browser." action={<Button onClick={() => router.push("/history")}>Back to history</Button>} />;
  }

  return (
    <div>
      <PageHeader
        title={moduleFullLabel[assessment.type]}
        subtitle={formatDate(assessment.createdAt, preferences.dateFormat)}
        breadcrumb={<Breadcrumb items={[{ label: "Students", href: "/students" }, { label: student.name, href: `/students/${student.id}` }, { label: moduleFullLabel[assessment.type] }]} />}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {assessment.adhdResult ? (
            <>
              <p className="max-w-2xl text-3xl font-bold text-heading">{adhdScreenStatus(assessment.adhdResult.screenPositive)}</p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-body">{assessment.adhdResult.message}</p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{assessment.adhdResult.disclaimer}</p>
              {assessment.isDemo ? <p className="mt-3 max-w-xl text-xs leading-5 text-faint">Demonstration record. A new questionnaire uses the saved screening model.</p> : null}
            </>
          ) : (
            <>
              <p className="font-heading text-5xl font-bold text-heading">{assessment.score}%</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <RiskBadge level={assessment.riskLevel} phrase />
                {assessment.isDemo ? <DemoBadge /> : null}
              </div>
              {assessment.isDemo ? <p className="mt-2 text-xs text-faint">Generated locally for interface testing.</p> : null}
              <p className="mt-3 max-w-xl text-sm text-muted">{PRODUCT.resultDisclaimer}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {assessment.adhdResult ? (
          <Card>
            <h2 className="text-base font-semibold text-heading">Screening status</h2>
            <p className="mt-3 text-sm font-semibold text-heading">{adhdScreenStatus(assessment.adhdResult.screenPositive)}</p>
            <p className="mt-2 text-sm leading-6 text-body">{assessment.adhdResult.message}</p>
            <p className="mt-3 text-xs text-faint">Source: Caregiver questionnaire{assessment.respondentRelationship ? ` · ${assessment.respondentRelationship}` : ""}</p>
            <p className="mt-1 text-xs text-faint">{student.name}</p>
          </Card>
        ) : (
        <Card className="flex flex-col items-center">
          <h2 className="mb-2 self-start text-base font-semibold text-heading">Risk Summary</h2>
          <RiskGauge value={assessment.score} level={assessment.riskLevel} />
          <p className="mt-2 text-sm text-muted">{student.name}</p>
          {assessment.audioDurationSec ? <p className="text-xs text-faint">Audio {formatDuration(assessment.audioDurationSec)}</p> : null}
        </Card>
        )}
        <Card>
          <h2 className="text-base font-semibold text-heading">{assessment.adhdResult ? "Responses with the strongest influence" : "Contributing Signals"}</h2>
          {assessment.adhdResult ? <p className="mt-2 text-xs leading-5 text-faint">These responses had the strongest association with the model output. They do not show that an answer caused ADHD.</p> : null}
          <div className="mt-4 space-y-4">
            {assessment.adhdResult
              ? assessment.adhdResult.topFactors.map((factor) => (
                  <div key={factor.feature}>
                    <p className="text-sm font-medium text-heading">{factor.question}</p>
                    <p className="text-sm text-body">{factor.answer}</p>
                    <p className="mt-1 text-xs text-faint">{factor.direction === "toward_flag" ? "Associated with the elevated pattern in this model." : "Associated with moving away from the elevated pattern."}</p>
                  </div>
                ))
              : assessment.factors.map((factor) => (
              <div key={factor.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-heading">{assessment.type === "adhd" ? featureLabel(factor.label) : factor.label}</span>
                  <span className="text-muted capitalize">{factor.impact} {assessment.type === "adhd" ? "influence" : "contribution"}</span>
                </div>
                {typeof factor.value === "number" ? <RiskBar value={factor.value} level={factor.impact === "high" ? "elevated" : factor.impact === "moderate" ? "moderate" : "low"} /> : null}
                {factor.detail ? <p className="mt-1 text-xs text-faint">{factor.detail}</p> : null}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-heading">Recommended next step</h2>
          <p className="mt-3 text-sm leading-6 text-body">{assessment.recommendation}</p>
          <div className="mt-5 flex flex-col gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-heading"><Check className="h-4 w-4 text-risk-low" aria-hidden /> Result saved</p>
            <Button
              variant="secondary"
              loading={reporting}
              onClick={async () => {
                if (reporting) return;
                setReporting(true);
                try {
                  await createReport(student.id);
                  toast.success("Report generated");
                  router.push(`/reports/${student.id}`);
                } catch {
                  setReporting(false);
                  toast.error("The report could not be generated. Try again.");
                }
              }}
            >
              Generate Report
            </Button>
            <Button variant="tertiary" onClick={() => router.push(`/students/${student.id}`)}>Return to Student</Button>
            <Link href={`/assessment/new?student=${student.id}`}><Button variant="tertiary">Start Another Assessment</Button></Link>
          </div>
        </Card>
      </div>

      {assessment.type === "dysgraphia" ? (
        <Card className="mt-4">
          <Tabs
            tabs={[
              { id: "original", label: "Original" },
              { id: "explanation", label: "Explanation" },
              { id: "both", label: "Side-by-side" },
            ]}
            value={view}
            onChange={setView}
          />
          <div className={`mt-4 grid gap-4 ${view === "both" ? "md:grid-cols-2" : ""}`}>
            {view !== "explanation" ? <HandwritingPanel image={assessment.imageDataUrl} /> : null}
            {view !== "original" ? (
              <HandwritingPanel
                image={assessment.imageDataUrl}
                explanationImageUrl={assessment.explanationImageUrl}
                exampleOverlay={Boolean(assessment.isDemo) && !assessment.explanationImageUrl}
              />
            ) : null}
          </div>
          {assessment.explanationImageUrl || assessment.isDemo ? (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-gradient-to-r from-[#E7EEF8] via-[#F6C89A] to-[#E07A3D]" />
              <div className="mt-1 flex justify-between text-xs text-muted"><span>Lower influence</span><span>Higher influence</span></div>
              <p className="mt-3 text-sm text-muted">
                {assessment.explanationImageUrl
                  ? "Highlighted regions represent areas that influenced the model prediction."
                  : "Example explanation visualization. This overlay is not a Grad-CAM map."}
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-4">
        <h2 className="text-base font-semibold text-heading">Why did LearnGuard flag this result?</h2>
        <p className="mt-3 text-sm leading-7 text-body">{assessment.explanation}</p>
        <p className="mt-3 text-xs leading-5 text-faint">{PRODUCT.explanationDisclaimer}</p>
      </Card>

      <div className="mt-4">
        <Accordion
          items={[
            {
              id: "model",
              title: "Advanced model details",
              content: (
                <dl className="grid gap-2 sm:grid-cols-2">
                  {assessment.modelName ? <div><dt className="text-muted">Model</dt><dd>{assessment.modelName}{assessment.isDemo ? " (demo label)" : ""}</dd></div> : null}
                  {assessment.modelVersion ? <div><dt className="text-muted">Model version</dt><dd>{assessment.modelVersion}</dd></div> : null}
                  {typeof assessment.adhdResult?.modelScore === "number" ? (
                    <div className="sm:col-span-2">
                      <dt className="text-muted">Research model score</dt>
                      <dd>{assessment.adhdResult.modelScore.toFixed(5)}</dd>
                      <p className="mt-1 text-xs leading-5 text-faint">This is the model output compared with the research threshold. It is not the probability that the child has ADHD.</p>
                    </div>
                  ) : null}
                  {typeof assessment.confidence === "number" ? <div><dt className="text-muted">Prediction confidence</dt><dd>{assessment.confidence.toFixed(2)}</dd></div> : null}
                  {assessment.inputQuality ? <div><dt className="text-muted">Input quality</dt><dd>{assessment.inputQuality}</dd></div> : null}
                  {assessment.explanationMethod ? <div><dt className="text-muted">Explanation method</dt><dd>{assessment.isDemo && assessment.type === "dysgraphia" && !assessment.explanationImageUrl ? "Example visualization" : assessment.explanationMethod}</dd></div> : null}
                  {assessment.datasetVersion ? <div><dt className="text-muted">Dataset version</dt><dd>{assessment.datasetVersion}</dd></div> : null}
                </dl>
              ),
            },
          ]}
        />
        {assessment.isDemo ? <p className="mt-2 text-xs text-faint">Model labels above are demonstration metadata, not a live inference record.</p> : null}
      </div>
      <ScreeningDisclaimer className="mt-4" />
    </div>
  );
}

function HandwritingPanel({
  image,
  explanationImageUrl,
  exampleOverlay,
}: {
  image?: string;
  explanationImageUrl?: string;
  exampleOverlay?: boolean;
}) {
  if (explanationImageUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-[#FBFBFD] p-4">
        <img src={explanationImageUrl} alt="Model explanation visualization" className="max-h-80 w-full object-contain" />
      </div>
    );
  }
  if (!image) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-line bg-[#FBFBFD] p-6 text-center text-sm text-muted">
        {exampleOverlay ? "Explanation visualization will appear after model analysis." : "No handwriting image was stored with this result."}
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-[#FBFBFD] p-4">
      <img src={image} alt={exampleOverlay ? "Handwriting with example overlay" : "Original handwriting"} className="max-h-80 w-full object-contain" />
      {exampleOverlay ? (
        <>
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute top-8 left-16 h-24 w-28 rounded-full bg-[#E07A3D]/35 blur-md" />
            <div className="absolute top-24 left-48 h-16 w-24 rounded-full bg-[#F6C89A]/50 blur-md" />
            <div className="absolute right-16 bottom-8 h-14 w-20 rounded-full bg-[#E7EEF8]/80 blur-sm" />
          </div>
          <p className="mt-2 text-xs text-muted">Example explanation visualization</p>
        </>
      ) : null}
    </div>
  );
}

