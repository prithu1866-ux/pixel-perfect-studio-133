import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const AiInput = z.object({
  species: z.string().max(30),
  breed: z.string().max(60).nullable(),
  ageMonths: z.number().nullable(),
  symptoms: z.array(z.string().max(80)).max(30),
  temperatureC: z.number().nullable(),
  durationDays: z.number().nullable(),
  affectedCount: z.number(),
  notes: z.string().max(1000),
  ruleRisk: z.string().max(20),
  lang: z.enum(["en", "hi"]),
});

export type AiAdvice = {
  summary: string;
  possible_conditions: { name: string; likelihood: "low" | "moderate" | "high"; reason: string }[];
  first_aid: string[];
  possible_treatments: { treatment: string; note: string }[];
  vaccinations: { vaccine: string; disease: string; timing: string }[];
  vet_urgency: string;
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "possible_conditions", "first_aid", "possible_treatments", "vaccinations", "vet_urgency"],
  properties: {
    summary: { type: "string" },
    possible_conditions: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["name", "likelihood", "reason"],
        properties: { name: { type: "string" }, likelihood: { type: "string", enum: ["low", "moderate", "high"] }, reason: { type: "string" } },
      },
    },
    first_aid: { type: "array", items: { type: "string" } },
    possible_treatments: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["treatment", "note"], properties: { treatment: { type: "string" }, note: { type: "string" } } },
    },
    vaccinations: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["vaccine", "disease", "timing"],
        properties: { vaccine: { type: "string" }, disease: { type: "string" }, timing: { type: "string" } },
      },
    },
    vet_urgency: { type: "string" },
  },
};

const SYSTEM = `You are a veterinary decision-support assistant for livestock farmers in India.
Given reported symptoms, list up to 3 possible conditions, safe first-aid steps, the treatments a veterinarian might typically consider,
and preventive vaccinations relevant to this species in India (e.g. NADCP FMD, Brucella S19, LSD/Goat-pox, PPR, CSF, HS/BQ) with typical timing.
Rules: never claim certainty; never give drug doses; say treatments must be prescribed by a veterinarian; flag notifiable diseases;
keep language very simple for farmers. Write all text fields in the requested language.`;

export const getAiAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AiInput.parse(d))
  .handler(async ({ data }): Promise<{ advice: AiAdvice | null; error: string | null }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { advice: null, error: "AI is not configured." };
    const userText = `Language: ${data.lang === "hi" ? "Hindi (Devanagari)" : "English"}
Species: ${data.species}${data.breed ? `, breed ${data.breed}` : ""}${data.ageMonths != null ? `, age ${data.ageMonths} months` : ""}
Symptoms: ${data.symptoms.join(", ") || "none selected"}
Temperature: ${data.temperatureC ?? "unknown"} °C; duration: ${data.durationDays ?? "unknown"} days; animals affected: ${data.affectedCount}
Farmer notes: ${data.notes || "none"}
Rule-based risk level already computed: ${data.ruleRisk}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions:
          SYSTEM +
          (data.lang === "hi"
            ? "\nIMPORTANT: Write EVERY text field (summary, condition names and reasons, first aid, treatments, notes, vaccine names, diseases, timing, urgency) in simple Hindi using Devanagari script. Do not answer in English, even though the symptoms are listed in English. You may add a common English disease or vaccine name in brackets after the Hindi."
            : "\nIMPORTANT: Write every text field in simple English."),
        input: [{ role: "user", content: userText }],
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "livestock_advice", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const msg: Record<number, string> = {
        402: "AI credits have run out. Please add credits to continue.",
        403: "AI access is not available for this workspace.",
        429: "Too many requests right now. Please try again in a minute.",
      };
      console.error("AI gateway error", res.status, await res.text().catch(() => ""));
      return { advice: null, error: msg[res.status] ?? "AI analysis failed. Please try again." };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let out = "";
    let failed: string | null = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, i);
        buf = buf.slice(i + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "response.output_text.delta") out += ev.delta;
            else if (ev.type === "response.refusal.delta" || ev.type === "response.failed" || ev.type === "error") failed = "The AI could not analyse this report.";
          } catch { /* partial */ }
        }
      }
    }
    if (failed || !out) return { advice: null, error: failed ?? "The AI returned no answer." };
    try {
      return { advice: JSON.parse(out) as AiAdvice, error: null };
    } catch {
      return { advice: null, error: "The AI answer could not be read." };
    }
  });
