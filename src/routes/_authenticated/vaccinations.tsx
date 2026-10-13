import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Syringe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/vaccinations")({
  head: () => ({ meta: [{ title: "Vaccinations — VETSENSE AI" }, { name: "description", content: "Vaccination records and due dates." }, { property: "og:title", content: "Vaccinations — VETSENSE AI" }, { property: "og:description", content: "Vaccination records and due dates." }] }),
  component: Vaccinations,
});

const PRESETS = [
  { vaccine: "FMD vaccine", disease: "FMD", months: 6 },
  { vaccine: "Lumpy Skin (Goat-pox)", disease: "LSD", months: 12 },
  { vaccine: "PPR vaccine", disease: "PPR", months: 36 },
  { vaccine: "Brucella S19", disease: "Brucellosis", months: 0 },
  { vaccine: "CSF vaccine", disease: "CSF", months: 12 },
  { vaccine: "HS + BQ", disease: "HS/BQ", months: 12 },
];

function Vaccinations() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["vaccinations", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("vaccinations").select("*, animals(name)").eq("owner_id", user!.id).order("next_due_on", { ascending: true, nullsFirst: false })).data ?? [],
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-semibold">{t("vaccinations")}</h1><VaccinationDialog /></div>
      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground"><Syringe className="mx-auto mb-2 size-8 text-leaf" />{lang === "hi" ? "अभी कोई टीका दर्ज नहीं।" : "No vaccinations recorded yet."}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground"><tr><th className="p-3">{lang === "hi" ? "पशु" : "Animal"}</th><th className="p-3">{lang === "hi" ? "टीका" : "Vaccine"}</th><th className="p-3">{lang === "hi" ? "लगाया" : "Given"}</th><th className="p-3">{lang === "hi" ? "अगला" : "Next due"}</th></tr></thead>
            <tbody className="divide-y">
              {data.map((v) => {
                const overdue = v.next_due_on && v.next_due_on < today;
                return (
                  <tr key={v.id}>
                    <td className="p-3 font-medium">{(v.animals as { name: string } | null)?.name}</td>
                    <td className="p-3">{v.vaccine}</td>
                    <td className="p-3">{v.administered_on ?? "—"}</td>
                    <td className={`p-3 ${overdue ? "font-semibold text-danger" : ""}`}>{v.next_due_on ?? "—"}{overdue && (lang === "hi" ? " (बाकी)" : " (overdue)")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function VaccinationDialog({ animalId }: { animalId?: string }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ animal_id: animalId ?? "", vaccine: "", disease: "", administered_on: today, next_due_on: "", administered_by: "" });
  const { data: animals = [] } = useQuery({
    queryKey: ["animals", user?.id],
    enabled: !!user && open,
    queryFn: async () => (await supabase.from("animals").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const preset = (i: number) => {
    const p = PRESETS[i]!;
    let next = "";
    if (p.months && f.administered_on) {
      const d = new Date(f.administered_on);
      d.setMonth(d.getMonth() + p.months);
      next = d.toISOString().slice(0, 10);
    }
    setF({ ...f, vaccine: p.vaccine, disease: p.disease, next_due_on: next });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.animal_id) { toast.error(lang === "hi" ? "पशु चुनें" : "Choose an animal"); return; }
    const { error } = await supabase.from("vaccinations").insert({
      owner_id: user!.id, animal_id: f.animal_id, vaccine: f.vaccine, disease: f.disease || null,
      administered_on: f.administered_on || null, next_due_on: f.next_due_on || null, administered_by: f.administered_by || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "hi" ? "टीका दर्ज हुआ" : "Vaccination recorded");
    qc.invalidateQueries();
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size={animalId ? "sm" : "lg"} variant={animalId ? "outline" : "default"}><Plus /> {lang === "hi" ? "टीका जोड़ें" : "Add vaccination"}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{lang === "hi" ? "टीका दर्ज करें" : "Record vaccination"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          {!animalId && (
            <div><Label>{lang === "hi" ? "पशु" : "Animal"}</Label>
              <select required value={f.animal_id} onChange={set("animal_id")} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">—</option>{animals.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select></div>
          )}
          <div className="flex flex-wrap gap-2">{PRESETS.map((p, i) => <button type="button" key={p.vaccine} onClick={() => preset(i)} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-leaf/30">{p.vaccine}</button>)}</div>
          <div><Label>{lang === "hi" ? "टीका" : "Vaccine"}</Label><Input required value={f.vaccine} onChange={set("vaccine")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{lang === "hi" ? "लगाने की तारीख" : "Date given"}</Label><Input type="date" value={f.administered_on} onChange={set("administered_on")} /></div>
            <div><Label>{lang === "hi" ? "अगली तारीख" : "Next due"}</Label><Input type="date" value={f.next_due_on} onChange={set("next_due_on")} /></div>
          </div>
          <div><Label>{lang === "hi" ? "किसने लगाया" : "Given by"}</Label><Input value={f.administered_by} onChange={set("administered_by")} /></div>
          <Button type="submit" size="lg" className="w-full">{t("save")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
