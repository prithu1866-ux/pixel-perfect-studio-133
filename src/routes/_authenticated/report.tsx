import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { runTriage, symptomsFromSpeech, SYMPTOMS, type Species } from "@/lib/triage";
import { sendReport } from "@/lib/offline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiskBadge } from "@/components/RiskBadge";
import { SpeakButton, VoiceButton } from "@/components/VoiceButton";
import { AiAdvicePanel } from "@/components/AiAdvicePanel";

export const Route = createFileRoute("/_authenticated/report")({
  validateSearch: z.object({ animal: z.string().optional() }),
  head: () => ({ meta: [{ title: "Report symptoms — VETSENSE AI" }, { name: "description", content: "Tell us what you see; get instant risk guidance." }, { property: "og:title", content: "Report symptoms — VETSENSE AI" }, { property: "og:description", content: "Instant rule-based livestock triage." }] }),
  component: ReportPage,
});

function ReportPage() {
  const { animal: preset } = Route.useSearch();
  const { t, pick, lang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [animalId, setAnimalId] = useState(preset ?? "");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [temp, setTemp] = useState("");
  const [days, setDays] = useState("");
  const [count, setCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: animals = [] } = useQuery({
    queryKey: ["animals", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("animals").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const animal = animals.find((a) => a.id === animalId);

  const result = useMemo(
    () => animal && symptoms.length ? runTriage({ species: animal.species as Species, symptoms, temperatureC: temp ? Number(temp) : null, durationDays: days ? Number(days) : null, affectedCount: Number(count) || 1 }) : null,
    [animal, symptoms, temp, days, count],
  );

  const toggle = (id: string) => setSymptoms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const onVoice = (text: string) => {
    setNotes((n) => (n ? n + " " : "") + text);
    const found = symptomsFromSpeech(text);
    if (found.length) {
      setSymptoms((s) => Array.from(new Set([...s, ...found])));
      toast.success(lang === "hi" ? `${found.length} लक्षण पहचाने गए — जाँच लें` : `Recognised ${found.length} symptom(s) — please check`);
    }
  };

  const submit = async () => {
    if (!animal || !result) return;
    setBusy(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("district").eq("id", user!.id).maybeSingle();
      const outcome = await sendReport({
        client_id: crypto.randomUUID(),
        owner_id: user!.id, animal_id: animal.id, symptoms,
        temperature_c: temp ? Number(temp) : null, duration_days: days ? Number(days) : null, affected_count: Number(count) || 1,
        notes: notes.slice(0, 1000) || null, risk_level: result.level, risk_score: result.score,
        triage_reasons: result.reasons, suspected_conditions: result.suspected, district: prof?.district ?? null,
      });
      toast.success(outcome === "sent" ? (lang === "hi" ? "रिपोर्ट पशु चिकित्सक को भेजी गई" : "Report sent to veterinarians") : t("offline"));
      nav({ to: "/reports" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const guidanceText = result ? result.guidance.map(pick).join(". ") : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t("report")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("disclaimer")}</p>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <Label className="text-base">1. {lang === "hi" ? "कौन सा पशु?" : "Which animal?"}</Label>
        <select value={animalId} onChange={(e) => setAnimalId(e.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3">
          <option value="">—</option>
          {animals.map((a) => <option key={a.id} value={a.id}>{a.name} {a.tag_id ? `(${a.tag_id})` : ""}</option>)}
        </select>
        {animals.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{lang === "hi" ? "पहले 'मेरे पशु' में पशु जोड़ें।" : "Add an animal under My Animals first."}</p>}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label className="text-base">2. {lang === "hi" ? "आप क्या देख रहे हैं?" : "What do you see?"}</Label>
          <VoiceButton onText={onVoice} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SYMPTOMS.map((s) => {
            const on = symptoms.includes(s.id);
            return (
              <button key={s.id} type="button" onClick={() => toggle(s.id)} aria-pressed={on}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${on ? (s.redFlag ? "border-danger bg-danger/10 text-danger" : "border-primary bg-secondary text-primary-deep") : "bg-background hover:border-primary/50"}`}>
                {pick(s)}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div><Label>{lang === "hi" ? "तापमान °C (अगर पता हो)" : "Temperature °C (if known)"}</Label><Input type="number" step="0.1" min={30} max={45} value={temp} onChange={(e) => setTemp(e.target.value)} /></div>
          <div><Label>{lang === "hi" ? "कितने दिन से?" : "For how many days?"}</Label><Input type="number" min={0} max={365} value={days} onChange={(e) => setDays(e.target.value)} /></div>
          <div><Label>{lang === "hi" ? "कितने पशु बीमार?" : "How many animals sick?"}</Label><Input type="number" min={1} max={10000} value={count} onChange={(e) => setCount(e.target.value)} /></div>
        </div>
        <div className="mt-3"><Label>{lang === "hi" ? "और जानकारी" : "Anything else"}</Label><textarea maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 min-h-20 w-full rounded-md border bg-background p-2 text-sm" /></div>
      </section>

      {result && (
        <section className="rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">3. {lang === "hi" ? "जोखिम आकलन" : "Risk assessment"}</h2>
            <RiskBadge level={result.level} className="px-4 py-1 text-sm" />
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{result.reasons.map((r, i) => <li key={i}>{pick(r)}</li>)}</ul>
          <div className="mt-4 rounded-xl bg-muted p-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{lang === "hi" ? "अभी क्या करें" : "What to do now"}</h3><SpeakButton text={guidanceText} /></div>
            <ul className="mt-2 space-y-1.5 text-sm">{result.guidance.map((g, i) => <li key={i}>• {pick(g)}</li>)}</ul>
          </div>
          <Button size="lg" className="mt-5 h-12 w-full text-base" onClick={submit} disabled={busy}>{t("submit")}</Button>
        </section>
      )}

      {result && animal && (
        <AiAdvicePanel
          species={animal.species}
          breed={animal.breed}
          ageMonths={animal.age_months}
          symptoms={symptoms.map((id) => SYMPTOMS.find((s) => s.id === id)?.en ?? id)}
          temperatureC={temp ? Number(temp) : null}
          durationDays={days ? Number(days) : null}
          affectedCount={Number(count) || 1}
          notes={notes}
          ruleRisk={result.level}
        />
      )}
    </div>
  );
}
