import type { HelpArticle } from "@/types";

export const helpArticles: HelpArticle[] = [
  {
    id: "start-1",
    category: "Getting Started",
    question: "How do I begin a screening?",
    answer:
      "Add the student, confirm guardian consent, then choose New Assessment. Select the student and the screening module. Each module keeps the teacher steps short: collect the input, review it, then run the analysis.",
  },
  {
    id: "start-2",
    category: "Getting Started",
    question: "Who is LearnGuard for?",
    answer:
      "LearnGuard is a teacher-facing screening and decision-support workspace. It helps organise early indicators. It does not replace a specialist assessment.",
  },
  {
    id: "dys-1",
    category: "Running a Dyslexia Screening",
    question: "How should the oral reading be recorded?",
    answer:
      "Use a quiet room, place the microphone at a comfortable distance, and ask the student to read the grade passage naturally. Do not correct or supply words during the reading. A clear WAV, MP3 or M4A file can also be uploaded.",
  },
  {
    id: "dys-2",
    category: "Running a Dyslexia Screening",
    question: "What passage should I use?",
    answer:
      "LearnGuard selects a short passage matched to the student’s grade. You can review the original text and, if needed, add what you heard. The transcript is optional.",
  },
  {
    id: "write-1",
    category: "Uploading Handwriting",
    question: "What makes a usable handwriting sample?",
    answer:
      "Use a clear photo or scan where the writing fills the frame. Avoid shadows, blur and cropped words. PNG and JPEG files are accepted. The quality check will warn you if the image is small or difficult to read.",
  },
  {
    id: "write-2",
    category: "Uploading Handwriting",
    question: "What does the highlighted image mean?",
    answer:
      "Highlighted regions show areas that influenced the model’s screening output. They do not prove a handwriting difficulty and should be read together with the factor list.",
  },
  {
    id: "adhd-1",
    category: "ADHD Caregiver Questionnaire",
    question: "Who should complete the ADHD questionnaire?",
    answer:
      "A parent or adult caregiver who knows the child's usual behaviour. It is not a teacher observation form. The current model is validated for children aged 6–11.",
  },
  {
    id: "adhd-2",
    category: "ADHD Caregiver Questionnaire",
    question: "Why is every question required?",
    answer:
      "The screening model expects one response for each of the 20 items. An unanswered question is not treated as No or Never. If you are unsure, save the draft and return after confirming the information.",
  },
  {
    id: "adhd-3",
    category: "ADHD Caregiver Questionnaire",
    question: "What does the result mean?",
    answer:
      "The result says whether the caregiver answers match an elevated ADHD-related pattern in the study data. It is not a percentage score and it is not a clinical diagnosis. Discuss persistent concerns with a qualified healthcare or educational professional.",
  },
  {
    id: "obs-1",
    category: "Classroom Observations",
    question: "Are classroom observations part of the ADHD model?",
    answer:
      "No. Teacher observations track attention, off-task events and task completion over time. They are kept separate from the caregiver questionnaire and are not sent to the current ADHD screening model.",
  },
  {
    id: "obs-2",
    category: "Classroom Observations",
    question: "What language should I use in teacher notes?",
    answer:
      "Describe what you saw: how long the student stayed with the task, how often prompting was needed, and whether the work was finished. Avoid diagnostic labels in the notes.",
  },
  {
    id: "risk-1",
    category: "Understanding Risk Scores",
    question: "What does Elevated Risk mean?",
    answer:
      "Elevated screening risk means the recorded indicators sit above the moderate range for that module. It is a prompt to review, continue observation, or consider referral. It is not a statement that a student has a learning disorder.",
  },
  {
    id: "risk-2",
    category: "Understanding Risk Scores",
    question: "Is LearnGuard a diagnostic tool?",
    answer:
      "No. LearnGuard provides AI-assisted screening support for educators. A clinical or psychoeducational diagnosis requires a qualified professional and a broader assessment than this system collects.",
  },
  {
    id: "risk-3",
    category: "Understanding Risk Scores",
    question: "Why is there no single combined diagnosis score?",
    answer:
      "Dyslexia, dysgraphia and ADHD-related indicators are kept separate. The overall concern is only a referral signal, taken from the strongest current module. The modules are not averaged into one condition probability.",
  },
  {
    id: "exp-1",
    category: "Understanding Explanations",
    question: "What does a SHAP explanation mean?",
    answer:
      "SHAP estimates how much each recorded input pushed this particular screening result up or down. A high contribution means that signal mattered for the score. It does not show medical cause.",
  },
  {
    id: "exp-2",
    category: "Understanding Explanations",
    question: "Where can I see the model name?",
    answer:
      "Open a result and expand Advanced model details. Teacher pages keep the model name, version and explanation method collapsed so the first view stays focused on the classroom next step.",
  },
  {
    id: "rep-1",
    category: "Reports",
    question: "What is included in a screening report?",
    answer:
      "A report summarises the student, each recorded module, the contributing indicators, the model explanation, the risk timeline and a teacher recommendation. Every report repeats the screening disclaimer.",
  },
  {
    id: "rep-2",
    category: "Reports",
    question: "Can I download a report?",
    answer:
      "Yes. Preview opens the full summary. Download saves an HTML copy, and Print uses the browser print dialog. A server-side PDF generator can replace this later.",
  },
  {
    id: "priv-1",
    category: "Privacy & Consent",
    question: "How is student information protected?",
    answer:
      "Students are listed under an internal LearnGuard ID as well as a name label. Guardian consent is required before a profile is saved. In this demonstration build, records stay in the browser. The intended deployment limits access to authorised school staff.",
  },
  {
    id: "priv-2",
    category: "Privacy & Consent",
    question: "Can a student record be removed?",
    answer:
      "Yes. Settings includes a delete action with a confirmation step. Removing a student also removes stored screenings, observations and reports for that profile in this demo.",
  },
];
