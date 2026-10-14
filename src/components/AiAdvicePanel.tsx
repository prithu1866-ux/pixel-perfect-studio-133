import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeakButton } from "@/components/VoiceButton";
import { useI18n, type Lang } from "@/lib/i18n";
import { getAiAdvice, type AiAdvice, AiInput } from "@/lib/ai-advice.functions";
import type { z } from "zod";

type Props = Omit<z.infer<typeof AiInput>, "lang">;

export function AiAdvicePanel(props: Props) {
  const { lang } = useI18n();
  const run = useServerFn(getAiAdvice);
  const [busy, setBusy] = useState(false);
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [adviceLang, setAdviceLang] = useState<Lang | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hi = lang === "hi";
  const reqId = useRef(0);

  const analyse = async (target: Lang = lang) => {
    const id = ++reqId.current;
    setBusy(true);
    setError(null);
    try {
      const r = await run({ data: { ...props, lang: target } });
      if (id !== reqId.current) return;
      setAdvice(r.advice);
      setAdviceLang(r.advice ? target : null);
      setError(r.error);
    } catch {
      if (id === reqId.current) setError(target === "hi" ? "विश्लेषण नहीं हो सका।" : "Analysis failed. Please try again.");
    } finally {
      if (id === reqId.current) setBusy(false);
    }
  };

  // Switching the language after an answer re-asks the AI in the new language.
  useEffect(() => {
    if (advice && adviceLang && adviceLang !== lang && !busy) void analyse(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const likely: Record<string, string> = hi ? { low: "कम", moderate: "मध्यम", high: "अधिक" } : { low: "Low", moderate: "Moderate", high: "High" };

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="size-5 text-leaf" />{hi ? "AI विश्लेषण" : "AI analysis"}</h2>
        <Button onClick={() => analyse()} disabled={busy} variant={advice ? "outline" : "default"}>
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {busy ? (hi ? "विश्लेषण हो रहा है…" : "Analysing…") : advice ? (hi ? "फिर से" : "Re-analyse") : hi ? "संभावित इलाज और टीके देखें" : "Get possible treatment & vaccines"}
        </Button>
      </div>
      {error && <p className="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {advice && (
        <div className="mt-4 space-y-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p>{advice.summary}</p>
            <SpeakButton text={[advice.summary, ...advice.first_aid, advice.vet_urgency].join(". ")} />
          </div>
          <Block title={hi ? "संभावित रोग" : "Possible conditions"}>
            {advice.possible_conditions.map((c, i) => (
              <li key={i}><strong>{c.name}</strong> <span className="rounded-full bg-muted px-2 text-xs">{likely[c.likelihood]}</span> — {c.reason}</li>
            ))}
          </Block>
          <Block title={hi ? "अभी क्या करें" : "First aid"}>{advice.first_aid.map((s, i) => <li key={i}>{s}</li>)}</Block>
          <Block title={hi ? "संभावित इलाज (पशु चिकित्सक तय करेंगे)" : "Possible treatment (vet must prescribe)"}>
            {advice.possible_treatments.map((t, i) => <li key={i}><strong>{t.treatment}</strong> — {t.note}</li>)}
          </Block>
          <Block title={hi ? "सुझाए गए टीके" : "Recommended vaccinations"}>
            {advice.vaccinations.map((v, i) => <li key={i}><strong>{v.vaccine}</strong> ({v.disease}) — {v.timing}</li>)}
          </Block>
          <p className="rounded-lg bg-warning/15 p-3 font-medium">{advice.vet_urgency}</p>
          <p className="text-xs text-muted-foreground">{hi ? "AI सुझाव निदान नहीं है। दवा केवल पशु चिकित्सक की सलाह से दें।" : "AI suggestions are not a diagnosis. Only give medicines prescribed by a veterinarian."}</p>
        </div>
      )}
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-primary-deep">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5">{children}</ul>
    </div>
  );
}
