import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { getQueue } from "@/lib/offline";
import { RiskBadge, StatusPill } from "@/components/RiskBadge";

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({ meta: [{ title: "My reports — VETSENSE AI" }, { name: "description", content: "Status of your symptom reports." }, { property: "og:title", content: "My reports — VETSENSE AI" }, { property: "og:description", content: "Status of your symptom reports." }] }),
  component: Reports,
});

function Reports() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [queued, setQueued] = useState(0);
  useEffect(() => {
    const r = () => setQueued(getQueue().length);
    r();
    window.addEventListener("vetsense-queue", r);
    return () => window.removeEventListener("vetsense-queue", r);
  }, []);
  const { data = [] } = useQuery({
    queryKey: ["reports", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("symptom_reports").select("id, risk_level, status, created_at, animals(name)").eq("owner_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{t("reports")}</h1>
      {queued > 0 && <p className="flex items-center gap-2 rounded-xl bg-offline/15 p-3 text-sm"><WifiOff className="size-4" /> {queued} {t("pendingSync")}</p>}
      {data.length === 0 ? <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">{lang === "hi" ? "कोई रिपोर्ट नहीं।" : "No reports yet."}</p> : (
        <ul className="divide-y rounded-2xl border bg-card shadow-card">
          {data.map((r) => (
            <li key={r.id}><Link to="/reports/$id" params={{ id: r.id }} className="flex items-center justify-between gap-3 p-4 hover:bg-muted">
              <div><div className="font-medium">{(r.animals as { name: string } | null)?.name}</div><div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div></div>
              <div className="flex gap-2"><StatusPill status={r.status} /><RiskBadge level={r.risk_level} /></div>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
