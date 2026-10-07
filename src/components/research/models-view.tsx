import { classDistribution, comparisonRows, datasetFacts, explainers, limitations, validationMethods } from "@/data/models";
import { MODEL_META } from "@/lib/constants";
import { isDemoMode } from "@/lib/api";
import { Card } from "@/components/ui/display";

export function ModelsView() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-heading">AI Models & Validation</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Transparent information about LearnGuard’s models, data and evaluation methodology. Teacher screens stay simpler. This page is for review and the evaluation panel.
        </p>
        {isDemoMode() ? (
          <p className="mt-4 max-w-3xl rounded-xl border border-lavender-border bg-primary-softer px-4 py-3 text-sm leading-6 text-body">
            Research data shown on this page is placeholder/demo content for frontend testing. Final validated FYP-II results will replace these values.
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ModelCard
          title="Dyslexia Model"
          inputs="Oral-reading audio + language features"
          baseline="MFCC + SVM"
          proposed="CNN / multimodal model"
          meta={MODEL_META.dyslexia}
          explanation="SHAP contribution scores on acoustic and linguistic features"
        />
        <ModelCard
          title="Dysgraphia Model"
          inputs="Handwriting images"
          baseline="CNN trained from the collected samples"
          proposed="CNN / transfer learning"
          meta={MODEL_META.dysgraphia}
          explanation="Grad-CAM region map"
        />
        <ModelCard
          title="ADHD-Related Model"
          inputs="Classroom behavioural observations"
          baseline="Logistic regression"
          proposed="Random forest and XGBoost comparison"
          meta={MODEL_META.adhd}
          explanation="SHAP on observation features"
        />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-heading">Research Comparison</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Figures below are demonstration placeholders so the table can be replaced with the final leakage-controlled evaluation. Each row is marked Demo data.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-soft text-xs text-muted">
              <tr>
                {["Method", "Modality", "Accuracy", "Precision", "Recall", "F1", "ROC-AUC", "Status"].map((header) => (
                  <th key={header} className="px-3 py-3 font-medium">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.method} className="border-t border-line">
                  <td className="px-3 py-3 text-heading">{row.method}</td>
                  <td className="px-3 py-3">{row.modality}</td>
                  <td className="px-3 py-3">{row.accuracy.toFixed(2)}</td>
                  <td className="px-3 py-3">{row.precision.toFixed(2)}</td>
                  <td className="px-3 py-3">{row.recall.toFixed(2)}</td>
                  <td className="px-3 py-3">{row.f1.toFixed(2)}</td>
                  <td className="px-3 py-3">{row.rocAuc.toFixed(2)}</td>
                  <td className="px-3 py-3 text-xs text-primary-dark">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-heading">Only results from the final leakage-controlled evaluation should be shown in the submitted system.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-heading">Dataset Information</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {datasetFacts.map((fact) => (
            <Card key={fact.label}>
              <p className="text-xs text-muted">{fact.label}</p>
              <p className="mt-1 text-lg font-semibold text-heading">{fact.value}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Augmented samples are not counted as independent participants. Names in this demonstration are sample labels. The research set is stored under study identifiers.</p>
        <h3 className="mt-6 text-base font-semibold text-heading">Class distribution</h3>
        <p className="mt-1 text-sm text-muted">Screening-band mix for the demonstration dataset. Replace these with the final report before submission.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {classDistribution.map((item) => (
            <Card key={item.label}>
              <p className="text-xs text-muted">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-heading">{item.value}</p>
              <p className="text-xs text-primary-dark">{item.note}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-heading">Validation Methodology</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {validationMethods.map((item) => (
            <Card key={item.title}>
              <h3 className="text-base font-semibold text-heading">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-heading">Explainability</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {explainers.map((item) => (
            <Card key={item.title}>
              <h3 className="text-base font-semibold text-heading">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-sm text-body">Feature attribution shows what influenced a prediction. It does not establish clinical causality.</p>
      </section>

      <Card className="mt-10">
        <h2 className="text-base font-semibold text-heading">Current Limitations</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-body">
          {limitations.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ModelCard({
  title,
  inputs,
  baseline,
  proposed,
  explanation,
  meta,
}: {
  title: string;
  inputs: string;
  baseline: string;
  proposed: string;
  explanation: string;
  meta: { model: string; version: string; method: string; dataset: string };
}) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-heading">{title}</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div><dt className="text-muted">Inputs</dt><dd className="text-heading">{inputs}</dd></div>
        <div><dt className="text-muted">Baseline</dt><dd>{baseline}</dd></div>
        <div><dt className="text-muted">Proposed</dt><dd>{proposed}</dd></div>
        <div><dt className="text-muted">Model</dt><dd>{meta.model}</dd></div>
        <div><dt className="text-muted">Version</dt><dd>{meta.version}</dd></div>
        <div><dt className="text-muted">Validation status</dt><dd>Demonstration metrics · replace with final evaluation</dd></div>
        <div><dt className="text-muted">Explanation</dt><dd>{explanation}</dd></div>
        <div><dt className="text-muted">Dataset</dt><dd>{meta.dataset}</dd></div>
      </dl>
    </Card>
  );
}
