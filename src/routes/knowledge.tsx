import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { DISEASES, SPECIES, SYMPTOMS } from "@/lib/triage";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/AppShell";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Livestock Disease Guide — VETSENSE AI" },
      { name: "description", content: "Signs and prevention for FMD, Lumpy Skin Disease, PPR, Classical Swine Fever and Brucellosis, in Hindi and English." },
      { property: "og:title", content: "Livestock Disease Guide — VETSENSE AI" },
      { property: "og:description", content: "Know the warning signs of major livestock diseases in India." },
    ],
  }),
  component: Knowledge,
});

function Knowledge() {
  const { pick, t, lang } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-5 py-4 md:px-10">
        <Logo />
        <div className="flex items-center gap-3"><LangToggle /><Link to="/dashboard" className="text-sm font-medium text-primary">{t("dashboard")} →</Link></div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-3xl font-semibold md:text-4xl">{t("knowledge")}</h1>
        <p className="mt-2 text-muted-foreground">{t("disclaimer")}</p>
        <div className="mt-8 space-y-5">
          {DISEASES.map((d) => (
            <article key={d.id} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-xl font-semibold">{pick(d.name)}</h2>
                {d.notifiable && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
                    <ShieldAlert className="size-3.5" /> {lang === "hi" ? "सूचनीय रोग" : "Notifiable"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{d.species.map((s) => pick(SPECIES.find((x) => x.id === s)!)).join(" · ")}</p>
              <p className="mt-3">{pick(d.summary)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {d.signs.map((s) => {
                  const sym = SYMPTOMS.find((x) => x.id === s)!;
                  return <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{pick(sym)}</span>;
                })}
              </div>
              <p className="mt-4 rounded-lg bg-muted p-3 text-sm"><strong>{lang === "hi" ? "बचाव: " : "Prevention: "}</strong>{pick(d.prevention)}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
