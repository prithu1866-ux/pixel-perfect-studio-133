import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, ClipboardCheck, Mic, ShieldCheck, Stethoscope, WifiOff } from "lucide-react";
import hero from "@/assets/hero-farmer.jpg";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VETSENSE AI — Early warning & vet care for Indian livestock" },
      { name: "description", content: "Spot livestock disease early, keep health and vaccination records, and reach a veterinarian — in Hindi or English, even offline." },
      { property: "og:title", content: "VETSENSE AI — Healthy Animals. Stronger Farmers." },
      { property: "og:description", content: "Livestock health surveillance, vaccination tracking and veterinary escalation for India." },
    ],
  }),
  component: Index,
});

const steps = [
  { Icon: ClipboardCheck, en: ["Detect", "Report symptoms by tapping or speaking. Clear rules flag risk instantly."], hi: ["पहचानें", "लक्षण टैप करें या बोलें। जोखिम तुरंत पता चलता है।"] },
  { Icon: BellRing, en: ["Prevent", "Vaccination records and due-date reminders for every animal."], hi: ["रोकें", "हर पशु का टीकाकरण रिकॉर्ड और याद-दिलाना।"] },
  { Icon: Stethoscope, en: ["Respond", "Reports reach a veterinarian who replies with advice and follow-up."], hi: ["उपचार", "रिपोर्ट पशु चिकित्सक तक पहुँचती है, वे सलाह देते हैं।"] },
  { Icon: WifiOff, en: ["Works offline", "No signal? Reports are saved on the phone and sent later."], hi: ["ऑफ़लाइन भी", "नेटवर्क नहीं? रिपोर्ट फ़ोन में सहेजी जाती है।"] },
];

function Index() {
  const { t, lang } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 md:px-10">
        <div className="rounded-xl bg-background/90 px-3 py-1.5"><Logo /></div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <Button asChild variant="secondary"><Link to="/auth">{t("signIn")}</Link></Button>
        </div>
      </header>

      <section className="relative isolate min-h-[88vh] overflow-hidden">
        <img src={hero} alt="Farmer caring for a Gir cow in a village courtyard" width={1600} height={1008} className="absolute inset-0 -z-10 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="flex min-h-[88vh] max-w-2xl flex-col justify-center px-5 pt-24 md:px-10">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-leaf/25 px-3 py-1 text-sm font-medium text-primary-foreground">
            <ShieldCheck className="size-4" /> {lang === "hi" ? "भारत के पशुपालकों के लिए" : "Built for India's livestock farmers"}
          </p>
          <h1 className="text-4xl font-semibold text-primary-foreground md:text-6xl">{t("tagline")}</h1>
          <p className="mt-5 max-w-xl text-lg text-primary-foreground/85">
            {lang === "hi"
              ? "बीमारी के शुरुआती लक्षण पहचानें, टीकाकरण का रिकॉर्ड रखें और पशु चिकित्सक तक पहुँचें — हिंदी में, आवाज़ से।"
              : "Catch disease signs early, keep every animal's health record, and reach a veterinarian — by voice, in Hindi or English."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 bg-leaf px-6 text-base text-primary-deep hover:bg-leaf/90">
              <Link to="/auth">{t("getStarted")} <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-primary-foreground/40 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/knowledge">{t("knowledge")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-10">
        <h2 className="max-w-xl text-3xl font-semibold">{lang === "hi" ? "एक ऐप, पशु स्वास्थ्य के पूरे सफ़र के लिए" : "One place for the whole animal-health journey"}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ Icon, en, hi }) => {
            const [h, p] = lang === "hi" ? hi : en;
            return (
              <div key={en[0]} className="rounded-2xl border bg-card p-6 shadow-card">
                <Icon className="size-7 text-primary" />
                <h3 className="mt-4 text-xl font-semibold">{h}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-primary-deep p-8 text-primary-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Mic className="size-10 text-leaf" />
            <p className="max-w-lg text-lg">{lang === "hi" ? "“मेरी गाय को बुखार है और मुँह में छाले हैं” — बस बोलिए, VETSENSE लक्षण भर देगा।" : "“Meri gaay ko bukhaar hai aur munh mein chhaale hain” — just speak, VETSENSE fills in the symptoms."}</p>
          </div>
          <Button asChild size="lg" className="bg-leaf text-primary-deep hover:bg-leaf/90"><Link to="/auth">{t("getStarted")}</Link></Button>
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">{t("disclaimer")} · Animal helpline 1962</p>
      </section>
    </div>
  );
}
