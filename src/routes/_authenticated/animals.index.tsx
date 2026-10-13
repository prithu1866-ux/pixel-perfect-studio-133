import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { SPECIES } from "@/lib/triage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/animals/")({
  head: () => ({ meta: [{ title: "My Animals — VETSENSE AI" }, { name: "description", content: "Your livestock registry." }, { property: "og:title", content: "My Animals — VETSENSE AI" }, { property: "og:description", content: "Your livestock registry." }] }),
  component: Animals,
});

export const healthLabel: Record<string, { en: string; hi: string; cls: string }> = {
  healthy: { en: "Healthy", hi: "स्वस्थ", cls: "bg-success/12 text-success" },
  under_observation: { en: "Under observation", hi: "निगरानी में", cls: "bg-warning/20 text-earth" },
  under_treatment: { en: "Under treatment", hi: "इलाज जारी", cls: "bg-danger/10 text-danger" },
  recovered: { en: "Recovered", hi: "ठीक हुआ", cls: "bg-info/10 text-info" },
};

function Animals() {
  const { t, pick, lang } = useI18n();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [species, setSpecies] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["animals", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("animals").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const list = data.filter((a) => (!species || a.species === species) && (a.name + (a.tag_id ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{t("animals")}</h1>
        <AnimalDialog />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder={lang === "hi" ? "नाम या टैग खोजें" : "Search name or tag"} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={species} onChange={(e) => setSpecies(e.target.value)} className="h-9 rounded-md border bg-card px-3 text-sm">
          <option value="">{lang === "hi" ? "सभी प्रजातियाँ" : "All species"}</option>
          {SPECIES.map((s) => <option key={s.id} value={s.id}>{pick(s)}</option>)}
        </select>
      </div>
      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">{lang === "hi" ? "कोई पशु नहीं मिला।" : "No animals found."}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => {
            const h = healthLabel[a.health_status] ?? healthLabel["healthy"]!;
            return (
              <Link key={a.id} to="/animals/$id" params={{ id: a.id }} className="rounded-2xl border bg-card p-5 shadow-card hover:border-primary">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{a.name}</h2>
                    <p className="text-sm text-muted-foreground">{pick(SPECIES.find((s) => s.id === a.species) ?? { en: a.species, hi: a.species })}{a.breed ? ` · ${a.breed}` : ""}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${h.cls}`}>{pick(h)}</span>
                </div>
                {a.tag_id && <p className="mt-3 text-xs text-muted-foreground">Tag: {a.tag_id}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

type AnimalRow = { id: string; name: string; species: string; breed: string | null; sex: string | null; age_months: number | null; weight_kg: number | null; tag_id: string | null; notes: string | null; health_status: string };

export function AnimalDialog({ animal }: { animal?: AnimalRow }) {
  const { t, pick, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: animal?.name ?? "", species: animal?.species ?? "cattle", breed: animal?.breed ?? "", sex: animal?.sex ?? "female",
    age_months: animal?.age_months?.toString() ?? "", weight_kg: animal?.weight_kg?.toString() ?? "", tag_id: animal?.tag_id ?? "", notes: animal?.notes ?? "",
    health_status: animal?.health_status ?? "healthy",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = {
      name: f.name.trim(), species: f.species, breed: f.breed || null, sex: f.sex, tag_id: f.tag_id || null, notes: f.notes || null, health_status: f.health_status,
      age_months: f.age_months ? Number(f.age_months) : null, weight_kg: f.weight_kg ? Number(f.weight_kg) : null,
    };
    const { error } = animal
      ? await supabase.from("animals").update(row).eq("id", animal.id)
      : await supabase.from("animals").insert({ ...row, owner_id: user!.id });
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "hi" ? "सहेजा गया" : "Saved");
    qc.invalidateQueries();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {animal ? <Button variant="outline">{lang === "hi" ? "बदलें" : "Edit"}</Button> : <Button size="lg"><Plus /> {t("addAnimal")}</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{animal ? animal.name : t("addAnimal")}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>{lang === "hi" ? "नाम" : "Name"}</Label><Input required maxLength={60} value={f.name} onChange={set("name")} /></div>
          <div><Label>{lang === "hi" ? "प्रजाति" : "Species"}</Label>
            <select value={f.species} onChange={set("species")} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">{SPECIES.map((s) => <option key={s.id} value={s.id}>{pick(s)}</option>)}</select></div>
          <div><Label>{lang === "hi" ? "लिंग" : "Sex"}</Label>
            <select value={f.sex} onChange={set("sex")} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="female">{lang === "hi" ? "मादा" : "Female"}</option><option value="male">{lang === "hi" ? "नर" : "Male"}</option></select></div>
          <div><Label>{lang === "hi" ? "नस्ल" : "Breed"}</Label><Input value={f.breed} onChange={set("breed")} /></div>
          <div><Label>{lang === "hi" ? "टैग नंबर" : "Ear tag"}</Label><Input value={f.tag_id} onChange={set("tag_id")} /></div>
          <div><Label>{lang === "hi" ? "उम्र (महीने)" : "Age (months)"}</Label><Input type="number" min={0} max={400} value={f.age_months} onChange={set("age_months")} /></div>
          <div><Label>{lang === "hi" ? "वज़न (किलो)" : "Weight (kg)"}</Label><Input type="number" min={0} max={2000} value={f.weight_kg} onChange={set("weight_kg")} /></div>
          {animal && (
            <div className="col-span-2"><Label>{lang === "hi" ? "स्वास्थ्य" : "Health status"}</Label>
              <select value={f.health_status} onChange={set("health_status")} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">{Object.entries(healthLabel).map(([k, v]) => <option key={k} value={k}>{pick(v)}</option>)}</select></div>
          )}
          <div className="col-span-2"><Label>{lang === "hi" ? "नोट" : "Notes"}</Label><textarea maxLength={500} value={f.notes} onChange={set("notes")} className="mt-1 min-h-16 w-full rounded-md border bg-background p-2 text-sm" /></div>
          <Button type="submit" className="col-span-2" size="lg">{t("save")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
