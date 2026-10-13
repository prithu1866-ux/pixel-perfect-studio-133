import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { RiskBadge, StatusPill } from "@/components/RiskBadge";

export const Route = createFileRoute("/_authenticated/vet")({
  head: () => ({ meta: [{ title: "Case queue — VETSENSE AI" }, { name: "description", content: "Veterinary case queue prioritised by risk." }, { property: "og:title", content: "Case queue — VETSENSE AI" }, { property: "og:description", content: "Veterinary case queue prioritised by risk." }] }),
  component: VetQueue,
});

const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function VetQueue() {
  const { t } = useI18n();
  const { isVet, loading } = useAuth();
  const [filter, setFilter] = useState("open");
  const { data = [] } = useQuery({
    queryKey: ["vet-queue"],
    enabled: isVet,
    queryFn: async () => (await supabase.from("symptom_reports").select("id, risk_level, status, created_at, district, affected_count, symptoms, temperature_c, animals(name, species)").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  if (loading) return null;
  if (!isVet) return <p className="rounded-2xl border bg-card p-6">This area is for registered veterinarians only.</p>;
  const list = data
    .filter((r) => (filter === "open" ? r.status !== "closed" && r.status !== "assessed" : filter === "all" ? true : r.status === filter))
    .sort((a, b) => (order[a.risk_level] ?? 9) - (order[b.risk_level] ?? 9) || b.created_at.localeCompare(a.created_at));
  const counts = { urgent: data.filter((r) => r.risk_level === "urgent" && r.status !== "closed").length, high: data.filter((r) => r.risk_level === "high" && r.status !== "closed").length };

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{t("vetQueue")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="font-display text-3xl text-danger">{counts.urgent}</div><div className="text-sm text-muted-foreground">Urgent open cases</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="font-display text-3xl text-earth">{counts.high}</div><div className="text-sm text-muted-foreground">High-risk open cases</div></div>
        <div className="rounded-2xl border bg-card p-5 shadow-card"><div className="font-display text-3xl">{data.length}</div><div className="text-sm text-muted-foreground">Total reports</div></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["open", "submitted", "under_review", "assessed", "closed", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-sm ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border"}`}>{f.replace("_", " ")}</button>
        ))}
      </div>
      <ul className="divide-y rounded-2xl border bg-card shadow-card">
        {list.length === 0 && <li className="p-6 text-center text-muted-foreground">No cases.</li>}
        {list.map((r) => {
          const a = r.animals as { name: string; species: string } | null;
          return (
            <li key={r.id}><Link to="/reports/$id" params={{ id: r.id }} className="flex items-center justify-between gap-3 p-4 hover:bg-muted">
              <div><div className="font-medium">{a?.name} · {a?.species}{r.affected_count > 1 ? ` · ${r.affected_count} affected` : ""}</div><div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}{r.district ? ` · ${r.district}` : ""}{r.temperature_c ? ` · ${r.temperature_c}°C` : ""}</div><div className="mt-1 text-xs text-muted-foreground">{r.symptoms.slice(0, 5).map((s) => s.replace(/_/g, " ")).join(", ")}{r.symptoms.length > 5 ? "…" : ""}</div></div>
              <div className="flex gap-2"><StatusPill status={r.status} /><RiskBadge level={r.risk_level} /></div>
            </Link></li>
          );
        })}
      </ul>
    </div>
  );
}
