import { z } from "zod";

export const Medication = z.object({ name: z.string(), dose: z.string(), frequency: z.string(), duration: z.string() });
export const AssessmentText = z.object({
  provisional_diagnosis: z.string(),
  treatment: z.string().nullable(),
  advice: z.string().nullable(),
  medications: z.array(Medication),
});
export type AssessmentContent = z.infer<typeof AssessmentText>;

// Drug identity and dose are never replaced by machine translation.
export function preservePrescription(original: AssessmentContent, translated: AssessmentContent): AssessmentContent {
  if (original.medications.length !== translated.medications.length) throw new Error("Incomplete medication translation.");
  return {
    ...translated,
    medications: translated.medications.map((m, i) => ({ ...m, name: original.medications[i].name, dose: original.medications[i].dose })),
  };
}