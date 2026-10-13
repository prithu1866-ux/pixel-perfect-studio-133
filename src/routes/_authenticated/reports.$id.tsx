import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { DISEASES, SYMPTOMS, type Bi } from "@/lib/triage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiskBadge, StatusPill } from "@/components/RiskBadge";
import { SpeakButton } from "@/components/VoiceButton";

export const Route = createFileRoute("/_authenticated/reports/$id")({
  head: () => ({ meta: [{ title: "Report details — VETSENSE AI" }, { name: "description", content: "Symptom report and veterinary response." }, { property: "og:title", content: "Report details — VETSENSE AI" }, { property: "og:description", content: "Symptom report and veterinary response." }] }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { pick, lang } = useI18n();
  const { isVet } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const [r, a] = await Promise.all([
        supabase.from("symptom_reports").select("*, animals(name, species, breed, tag_id)").eq("id", id).maybeSingle(),
        supabase.from("assessments").select("*").eq("report_id", id).order("created_at", { ascending: false }),
      ]);
      return { report: r.data, assessments: a.data ?? [] };
    },
  });
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const r = data?.report;
  if (!r) return <p>Report not found.</p>;
  const animal = r.animals as { name: string; species: string; breed: string | null; tag_id: string | null } | null;

  return (
    <div className="space-y-6">
      <Link to={isVet ? "/vet" : "/reports"} className="text-sm text-primary">← Back</Link>
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{animal?.name} <span className="text-base font-normal text-muted-foreground">· {animal?.species}{animal?.breed ? ` · ${animal.breed}` : ""}</span></h1>
            <p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}{r.district ? ` · ${r.district}` : ""}</p>
          </div>
          <div className="flex gap-2"><StatusPill status={r.status} /><RiskBadge level={r.risk_level} /></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{r.symptoms.map((s) => { const sym = SYMPTOMS.find((x) => x.id === s); return <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{sym ? pick(sym) : s}</span>; })}</div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-muted-foreground">Temp</dt><dd>{r.temperature_c ? `${r.temperature_c}°C` : "—"}</dd></div>
          <div><dt className="text-muted-foreground">Days</dt><dd>{r.duration_days ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Affected</dt><dd>{r.affected_count}</dd></div>
        </dl>
        {r.notes && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{r.notes}</p>}
        <h2 className="mt-5 text-base font-semibold">{lang === "hi" ? "आकलन के कारण" : "Why this risk level"}</h2>
        <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{(r.triage_reasons as Bi[]).map((x, i) => <li key={i}>{pick(x)}</li>)}</ul>
        {r.suspected_conditions.length > 0 && <p className="mt-2 text-sm">{lang === "hi" ? "संभावित (पुष्टि आवश्यक): " : "Possible (needs confirmation): "}<strong>{r.suspected_conditions.map((d) => { const x = DISEASES.find((z) => z.id === d); return x ? pick(x.name) : d; }).join(", ")}</strong></p>}
      </div>

      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Stethoscope className="size-5 text-primary" />{lang === "hi" ? "पशु चिकित्सक की सलाह" : "Veterinarian's response"}</h2>
        {data.assessments.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{lang === "hi" ? "अभी जवाब नहीं आया।" : "Awaiting review."}</p>}
        {data.assessments.map((a) => (
          <div key={a.id} className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">
            <div className="flex items-center justify-between"><strong className="text-base">{a.provisional_diagnosis}</strong><SpeakButton text={[a.provisional_diagnosis, a.treatment, a.advice].filter(Boolean).join(". ")} /></div>
            {a.treatment && <p className="mt-2"><b>Treatment:</b> {a.treatment}</p>}
            {a.advice && <p className="mt-1"><b>Advice:</b> {a.advice}</p>}
            {a.follow_up_date && <p className="mt-1"><b>Follow-up:</b> {a.follow_up_date}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
          </div>
        ))}
        {isVet && <AssessmentForm reportId={r.id} status={r.status} />}
      </section>
    </div>
  );
}

function AssessmentForm({ reportId, status }: { reportId: string; status: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ provisional_diagnosis: "", treatment: "", advice: "", follow_up_date: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("assessments").insert({ report_id: reportId, vet_id: user!.id, provisional_diagnosis: f.provisional_diagnosis, treatment: f.treatment || null, advice: f.advice || null, follow_up_date: f.follow_up_date || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Assessment sent to farmer");
    setF({ provisional_diagnosis: "", treatment: "", advice: "", follow_up_date: "" });
    qc.invalidateQueries();
  };
  const setStatus = async (s: string) => {
    const { error } = await supabase.from("symptom_reports").update({ status: s }).eq("id", reportId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
  };
  return (
    <form onSubmit={save} className="mt-6 space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Clinical assessment</h3>
        <div className="flex gap-2">
          {status === "submitted" && <Button type="button" variant="outline" size="sm" onClick={() => setStatus("under_review")}>Mark under review</Button>}
          {status !== "closed" && <Button type="button" variant="ghost" size="sm" onClick={() => setStatus("closed")}>Close case</Button>}
        </div>
      </div>
      <div><Label>Provisional diagnosis</Label><Input required maxLength={200} value={f.provisional_diagnosis} onChange={set("provisional_diagnosis")} /></div>
      <div><Label>Treatment</Label><textarea maxLength={1000} value={f.treatment} onChange={set("treatment")} className="mt-1 min-h-16 w-full rounded-md border bg-background p-2 text-sm" /></div>
      <div><Label>Advice to farmer</Label><textarea maxLength={1000} value={f.advice} onChange={set("advice")} className="mt-1 min-h-16 w-full rounded-md border bg-background p-2 text-sm" /></div>
      <div className="max-w-xs"><Label>Follow-up date</Label><Input type="date" value={f.follow_up_date} onChange={set("follow_up_date")} /></div>
      <Button type="submit">Send assessment</Button>
    </form>
  );
}
