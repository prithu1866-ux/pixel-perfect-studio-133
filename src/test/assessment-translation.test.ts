import { describe, expect, it } from "vitest";
import { preservePrescription } from "@/lib/assessment-translation";

const original = { provisional_diagnosis: "Fever", treatment: "Vet review", advice: null, medications: [{ name: "Example medicine", dose: "5 ml", frequency: "Twice daily", duration: "3 days" }] };
describe("Veterinary translation safety", () => {
  it("keeps original drug identity and dose while translating instructions", () => {
    const result = preservePrescription(original, { ...original, provisional_diagnosis: "बुखार", medications: [{ name: "changed", dose: "50 ml", frequency: "दिन में दो बार", duration: "3 दिन" }] });
    expect(result.medications[0]).toEqual({ name: "Example medicine", dose: "5 ml", frequency: "दिन में दो बार", duration: "3 दिन" });
    expect(original.provisional_diagnosis).toBe("Fever");
  });
  it("rejects translations that omit medication rows", () => {
    expect(() => preservePrescription(original, { ...original, medications: [] })).toThrow("Incomplete medication translation");
  });
});