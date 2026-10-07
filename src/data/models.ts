import type { ModelMetricRow } from "@/types";

export const comparisonRows: ModelMetricRow[] = [
  { method: "MFCC + SVM (baseline)", modality: "Oral-reading audio", accuracy: 0.74, precision: 0.71, recall: 0.69, f1: 0.7, rocAuc: 0.78, status: "Demo data" },
  { method: "CNN audio classifier", modality: "Oral-reading audio", accuracy: 0.83, precision: 0.81, recall: 0.8, f1: 0.8, rocAuc: 0.88, status: "Demo data" },
  { method: "CNN + language features", modality: "Audio + reading text", accuracy: 0.86, precision: 0.84, recall: 0.85, f1: 0.84, rocAuc: 0.9, status: "Demo data" },
  { method: "Handwriting CNN", modality: "Handwriting image", accuracy: 0.81, precision: 0.79, recall: 0.77, f1: 0.78, rocAuc: 0.85, status: "Demo data" },
  { method: "Transfer-learning CNN", modality: "Handwriting image", accuracy: 0.84, precision: 0.82, recall: 0.8, f1: 0.81, rocAuc: 0.87, status: "Demo data" },
  { method: "Logistic regression", modality: "Behaviour observations", accuracy: 0.72, precision: 0.7, recall: 0.68, f1: 0.69, rocAuc: 0.76, status: "Demo data" },
  { method: "Random forest", modality: "Behaviour observations", accuracy: 0.77, precision: 0.75, recall: 0.74, f1: 0.74, rocAuc: 0.82, status: "Demo data" },
  { method: "XGBoost", modality: "Behaviour observations", accuracy: 0.8, precision: 0.78, recall: 0.77, f1: 0.77, rocAuc: 0.84, status: "Demo data" },
];

export const datasetFacts = [
  { label: "Dataset name", value: "LearnGuard School Screening Set" },
  { label: "Dataset version", value: "LG-2026.1" },
  { label: "Independent participants", value: "86" },
  { label: "Training participants", value: "60" },
  { label: "Validation participants", value: "12" },
  { label: "Test participants", value: "14" },
  { label: "Collection source", value: "Consented school sessions" },
  { label: "Modalities", value: "Audio, handwriting, observations" },
];

export const classDistribution = [
  { label: "Low", value: "41%", note: "Demo data" },
  { label: "Moderate", value: "27%", note: "Demo data" },
  { label: "Elevated", value: "22%", note: "Demo data" },
  { label: "High", value: "10%", note: "Demo data" },
];

export const validationMethods = [
  {
    title: "Participant-independent split",
    body: "The same student never appears in more than one of training, validation and test. This limits identity leakage across splits.",
  },
  {
    title: "Cross-validation",
    body: "Model selection uses participant-level folds so a recording, page or observation from one student cannot train and test the same model.",
  },
  {
    title: "Held-out test set",
    body: "The test partition is locked before the final comparison. It is not used to choose features or thresholds.",
  },
  {
    title: "Ablation study",
    body: "Audio-only, text-only and combined dyslexia inputs are compared so the contribution of each modality can be inspected.",
  },
  {
    title: "Base-paper comparison",
    body: "The dyslexia baseline follows the MFCC and SVM setup from the base paper, then compares it with the proposed CNN model on the same split.",
  },
  {
    title: "Statistical comparison",
    body: "Paired comparisons on the held-out participants are planned so an accuracy difference is not reported from a single lucky split.",
  },
];

export const explainers = [
  {
    title: "SHAP",
    body: "Assigns a contribution score to each input feature for a single prediction. Used for the audio and behaviour models.",
  },
  {
    title: "LIME",
    body: "Planned comparison method. It is not the explanation shown on teacher result pages. SHAP and Grad-CAM are the active methods in this build.",
  },
  {
    title: "Grad-CAM",
    body: "Highlights image regions that influenced the handwriting model. The map is an influence view, not proof of a condition.",
  },
];

export const limitations = [
  "The dataset remains limited in size.",
  "Performance may vary between schools and recording conditions.",
  "LearnGuard is intended for screening rather than diagnosis.",
  "Further external validation is required before the figures are treated as confirmed.",
  "Model explanations show which inputs influenced a prediction. They do not establish medical cause.",
];
