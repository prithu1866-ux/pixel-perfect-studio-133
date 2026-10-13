import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { SPECIES } from "@/lib/triage";
import { Button } from "@/components/ui/button";
import { RiskBadge, StatusPill } from "@/components/RiskBadge";
import { AnimalDialog, healthLabel } from "./animals.index";
import { VaccinationDialog } from "./vaccinations";

export const Route = createFileRoute("/_authenticated/animals/$id")({
  head: () => ({ meta: [{ title: "Animal profile — VETSENSE AI" }, { name: "description", content: "Health history and vaccinations." }, { property: "og:title", content: "Animal profile — VETSENSE AI" }, { property: "og:description", content: "Health history and vaccinations." }] }),
  component: AnimalPage,
});

function AnimalPage() {
  const { id } = Route.useParams();
  const { pick, lang, t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["animal", id],
    queryFn: async () => {
      const [a, r, v] = await Promise.all([
        supabase.from("animals").select("*").eq("id", id).maybeSingle(),
        supabase.from("symptom_reports").select("id, risk_level, status, created_at, symptoms").eq("animal_id", id).order("created_at", { ascending: false }),
        supabase.from("vaccinations").select("*").eq("animal_id", id).order("administered_on", { ascending: false }),
      ]);
      return { animal: a.data, reports: r.data ?? [], vacc: v.data ?? [] };
    },
  });
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const a = data?.animal;
  if (!a) return <p>Animal not found. <Link to="/animals" className="text-primary">Back</Link></p>;
  const h = healthLabel[a.health_status] ?? healthLabel.healthy;

  return (
    <div className="space-y-6">
      <Link to="/animals" className="text-sm text-primary">← {t("animals")}</Link>
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-card p-6 shadow-card">
        <div>
          <h1 className="text-3xl font-semibold">{a.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {pick(SPECIES.find((s) => s.id === a.species) ?? { en: a.species, hi: a.species })}
            {a.breed && ` · ${a.breed}`}{a.sex && ` · ${a.sex}`}{a.age_months != null && ` · ${a.age_months} mo`}{a.weight_kg != null && ` · ${a.weight_kg} kg`}
          </p>
          {a.tag_id && <p className="mt-1 text-sm text-muted-foreground">Tag {a.tag_id}</p>}
          <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${h.cls}`}>{pick(h)}</span>
        </div>
        <div className="flex gap-2">
          <AnimalDialog animal={a} />
          <Button asChild><Link to="/report" search={{ animal: a.id }}><HeartPulse /> {t("report")}</Link></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">{lang === "hi" ? "स्वास्थ्य इतिहास" : "Health history"}</h2>
          <ul className="mt-3 divide-y">
            {data.reports.length === 0 && <li className="py-3 text-sm text-muted-foreground">—</li>}
            {data.reports.map((r) => (
              <li key={r.id}><Link to="/reports/$id" params={{ id: r.id }} className="flex items-center justify-between py-3 text-sm hover:text-primary">
                <span>{new Date(r.created_at).toLocaleDateString()}</span><span className="flex gap-2"><StatusPill status={r.status} /><RiskBadge level={r.risk_level} /></span>
              </Link></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{t("vaccinations")}</h2><VaccinationDialog animalId={a.id} /></div>
          <ul className="mt-3 divide-y">
            {data.vacc.length === 0 && <li className="py-3 text-sm text-muted-foreground">—</li>}
            {data.vacc.map((v) => (
              <li key={v.id} className="flex justify-between py-3 text-sm"><span className="font-medium">{v.vaccine}</span><span className="text-muted-foreground">{v.administered_on} {v.next_due_on && `→ ${v.next_due_on}`}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
