import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, PawPrint, Plus, Syringe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { RiskBadge, StatusPill } from "@/components/RiskBadge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — VETSENSE AI" }, { name: "description", content: "Your herd health at a glance." }, { property: "og:title", content: "Dashboard — VETSENSE AI" }, { property: "og:description", content: "Your herd health at a glance." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
      const [animals, reports, due, profile] = await Promise.all([
        supabase.from("animals").select("id, health_status").eq("owner_id", user!.id),
        supabase.from("symptom_reports").select("id, risk_level, status, created_at, animals(name)").eq("owner_id", user!.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("vaccinations").select("id, vaccine, next_due_on, animals(name)").eq("owner_id", user!.id).lte("next_due_on", in30).order("next_due_on"),
        supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle(),
      ]);
      return { animals: animals.data ?? [], reports: reports.data ?? [], due: due.data ?? [], name: profile.data?.full_name, today };
    },
  });

  const total = data?.animals.length ?? 0;
  const watch = data?.animals.filter((a) => a.health_status !== "healthy").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-3xl font-semibold">{lang === "hi" ? "नमस्ते" : "Namaste"}{data?.name ? `, ${data.name}` : ""}</h1>
        </div>
        <Button asChild size="lg" className="h-12"><Link to="/report"><HeartPulse /> {t("report")}</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<PawPrint />} label={t("animals")} value={total} to="/animals" />
        <Stat icon={<HeartPulse />} label={lang === "hi" ? "निगरानी में" : "Under observation"} value={watch} to="/animals" tone={watch ? "warn" : undefined} />
        <Stat icon={<Syringe />} label={lang === "hi" ? "30 दिन में टीके" : "Vaccines due (30 days)"} value={data?.due.length ?? 0} to="/vaccinations" />
      </div>

      {total === 0 && data && (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
          <PawPrint className="mx-auto size-10 text-leaf" />
          <h2 className="mt-3 text-xl font-semibold">{lang === "hi" ? "अपना पहला पशु जोड़ें" : "Add your first animal"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{lang === "hi" ? "स्वास्थ्य रिकॉर्ड और टीकाकरण यहीं से शुरू होते हैं।" : "Health records and vaccinations start here."}</p>
          <Button asChild className="mt-4"><Link to="/animals"><Plus /> {t("addAnimal")}</Link></Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">{lang === "hi" ? "हाल की रिपोर्ट" : "Recent reports"}</h2>
          <ul className="mt-3 divide-y">
            {data?.reports.length === 0 && <li className="py-4 text-sm text-muted-foreground">{lang === "hi" ? "अभी कोई रिपोर्ट नहीं।" : "No reports yet."}</li>}
            {data?.reports.map((r) => (
              <li key={r.id}>
                <Link to="/reports/$id" params={{ id: r.id }} className="flex items-center justify-between gap-2 py-3 hover:text-primary">
                  <span className="font-medium">{(r.animals as { name: string } | null)?.name}</span>
                  <span className="flex items-center gap-2"><StatusPill status={r.status} /><RiskBadge level={r.risk_level} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">{lang === "hi" ? "आगामी देखभाल" : "Upcoming care"}</h2>
          <ul className="mt-3 divide-y">
            {data?.due.length === 0 && <li className="py-4 text-sm text-muted-foreground">{lang === "hi" ? "कोई टीका बाकी नहीं।" : "Nothing due soon."}</li>}
            {data?.due.map((v) => {
              const overdue = v.next_due_on! < data.today;
              return (
                <li key={v.id} className="flex items-center justify-between py-3">
                  <span><span className="font-medium">{v.vaccine}</span> · {(v.animals as { name: string } | null)?.name}</span>
                  <span className={`text-sm font-medium ${overdue ? "text-danger" : "text-muted-foreground"}`}>{overdue ? (lang === "hi" ? "बाकी: " : "Overdue: ") : ""}{v.next_due_on}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, to, tone }: { icon: React.ReactNode; label: string; value: number; to: "/animals" | "/vaccinations"; tone?: "warn" }) {
  return (
    <Link to={to} className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-card hover:border-primary">
      <span className={`grid size-11 place-items-center rounded-xl ${tone ? "bg-warning/20 text-earth" : "bg-secondary text-primary"} [&_svg]:size-5`}>{icon}</span>
      <div><div className="font-display text-3xl font-semibold text-primary-deep">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>
    </Link>
  );
}
