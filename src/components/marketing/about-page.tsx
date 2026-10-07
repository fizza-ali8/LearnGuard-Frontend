import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { Card } from "@/components/ui/display";

const modules = [
  ["Dyslexia", "Oral-reading audio and language features, explained with contribution scores."],
  ["Dysgraphia", "Handwriting images with a region-level influence view."],
  ["ADHD-related", "Repeated classroom observations of attention, task completion and behaviour."],
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-[960px] px-5 py-16 md:px-8">
        <p className="text-sm font-medium text-primary-dark">About LearnGuard</p>
        <h1 className="mt-3 text-4xl font-bold text-heading md:text-5xl">A screening workspace for earlier educational support.</h1>
        <p className="mt-5 text-base leading-7 text-body">
          LearnGuard is a final-year research system for multimodal early screening. It helps a teacher collect classroom evidence, review a screening indicator, and see which signals influenced the result.
        </p>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-heading">Research motivation</h2>
          <p className="mt-3 text-sm leading-7 text-body">
            Learning difficulties are often noticed late, after a student has already spent terms struggling with reading, writing or sustained classroom tasks. LearnGuard explores whether school-friendly inputs — a short oral reading, a handwriting sample, and structured observations — can surface earlier indicators without claiming a medical diagnosis.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-heading">System modules</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {modules.map(([title, body]) => (
              <Card key={title}>
                <h3 className="text-base font-semibold text-heading">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-heading">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-body">
            <li>1. A consented student profile is created under an internal LearnGuard ID.</li>
            <li>2. The teacher records one module at a time, with a quality check before analysis.</li>
            <li>3. The result shows a screening level, the contributing signals, and a classroom next step.</li>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-heading">Explainable results</h2>
          <p className="mt-3 text-sm leading-7 text-body">
            Each screening result lists the signals that influenced it, such as reading rate, spacing or off-task events. SHAP is used for audio and behaviour. Grad-CAM is used for handwriting. These views describe model influence. They do not establish a medical cause, and LearnGuard does not present them as a diagnosis.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-heading">Ethics and privacy</h2>
          <p className="mt-3 text-sm leading-7 text-body">
            Guardian consent is part of the student record. The interface avoids diagnostic language. Explanations describe model influence, not medical cause. Access in a school deployment is intended for authorised staff only.
          </p>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold text-heading">Team</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Final year project team, FAST-NUCES, 2026. Names can be added here before the evaluation booklet is printed.</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-heading">Supervision</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Supervised within the FAST-NUCES final year project programme. Model claims on the research page are labelled until the leakage-controlled evaluation is locked.</p>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
