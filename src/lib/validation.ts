import { GRADES } from "@/lib/constants";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

export const forgotSchema = z.object({
  email: z.string().min(1, "Enter your email address").email("Enter a valid email address"),
});

export const studentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Enter a student ID")
    .max(24, "Student ID must be 24 characters or fewer"),
  name: z.string().trim().min(2, "Enter the student name or label").max(60, "Name is too long"),
  age: z.coerce
    .number({ invalid_type_error: "Enter a valid age" })
    .int("Age must be a whole number")
    .min(5, "Age must be at least 5")
    .max(18, "Age must be 18 or under"),
  grade: z.string().refine((value) => GRADES.includes(value), "Select a supported grade"),
  school: z.string().trim().min(2, "Enter the school").max(80, "School name is too long"),
  section: z.string().trim().min(1, "Enter the class or section").max(20, "Section name is too long"),
  previousAssessment: z.enum(["yes", "no"], { required_error: "Select whether a previous assessment exists" }),
  notes: z.string().trim().max(500, "Keep notes within 500 characters").optional(),
  consentVerified: z.boolean().refine((value) => value, {
    message: "Confirm that guardian consent has been verified",
  }),
  consentDate: z.string().min(1, "Enter the consent date"),
});

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email address"),
});

export const behaviourSchema = z.object({
  date: z.string().min(1, "Enter the observation date"),
  subject: z.string().trim().min(2, "Enter the subject or task"),
  durationMin: z.coerce.number().int().min(5, "Duration should be at least 5 minutes").max(90, "Duration looks too long"),
  environment: z.string().trim().min(2, "Enter the class or environment"),
  sustainedAttentionMin: z.coerce.number().min(0, "Enter estimated attention time").max(90),
  offTaskEvents: z.coerce.number().int().min(0).max(40),
  instructionsRepeated: z.coerce.number().int().min(0).max(20),
  responseToInstructions: z.enum(["immediate", "minor_delay", "repeated_prompting", "significant_difficulty"]),
  taskCompletionPct: z.coerce.number().min(0).max(100),
  taskCompletionTimeMin: z.coerce.number().min(0).max(90),
  taskAbandonment: z.enum(["never", "rarely", "sometimes", "often", "very_often"]),
  consistency: z.coerce.number().int().min(1).max(5),
  seatLeaving: z.coerce.number().int().min(0).max(20),
  interruptions: z.coerce.number().int().min(0).max(30),
  restlessness: z.coerce.number().int().min(1).max(5),
  impulsiveResponses: z.coerce.number().int().min(0).max(30),
  notes: z.string().max(600, "Keep notes within 600 characters").optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type StudentFormValues = z.infer<typeof studentSchema>;
export type AccountValues = z.infer<typeof accountSchema>;
export type BehaviourValues = z.infer<typeof behaviourSchema>;
