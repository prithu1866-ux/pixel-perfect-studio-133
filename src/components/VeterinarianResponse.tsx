import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { translateAssessment } from "@/lib/assessment-translation.functions";
import { AssessmentText } from "@/lib/assessment-translation";
import type { Database } from "@/integrations/supabase/types";
import { RiskBadge } from "./RiskBadge";
import { SpeakButton } from "./VoiceButton";

type Assessment = Database["public"]["Tables"]["assessments"]["Row"];

export function VeterinarianResponse({ assessment: a }: { assessment: Assessment }) {
  const { lang } = useI18n();
  const { user } = useAuth();
  const run = useServerFn(translateAssessment);
  const original = AssessmentText.parse({ ...a, medications: a.medications ?? [] });
  const source = JSON.stringify(original);
  const needsTranslation = lang === "hi" || /[\u0900-\u097f]/.test(source);
  const translation = useQuery({
    queryKey: ["assessment-translation", user?.id, a.id, source, lang],
    queryFn: () => run({ data: { id: a.id, lang } }),
    enabled: needsTranslation,
    staleTime: Infinity, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false, retryOnMount: false,
  });
  const hi = lang === "hi";
  const content = needsTranslation ? translation.data?.content : original;
  const shown = content ?? original;
  const busy = needsTranslation && translation.isPending;
  const error = translation.data?.error ?? (translation.isError ? (hi ? "अनुवाद नहीं हो सका। मूल सलाह नीचे दी गई है।" : "Translation failed. The original response is shown below.") : null);
  const speech = [shown.provisional_diagnosis, shown.treatment, ...shown.medications.map(m => `${m.name} ${m.dose} ${m.frequency} ${m.duration}`), shown.advice, a.follow_up_date ? `${hi ? "अगली जाँच" : "Follow-up"}: ${a.follow_up_date}` : null].filter(Boolean).join(". ");
  return (
    <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm" aria-busy={busy}>
      <div aria-live="polite">
        {busy && <p role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" />{hi ? "हिंदी में अनुवाद हो रहा है…" : "Translating into English…"}</p>}
        {error && <p role="alert" className="mb-2 text-danger">{error}</p>}
      </div>
      {!busy && <>
        {needsTranslation && !content && <p className="mb-2 text-muted-foreground">{hi ? "मूल पशु चिकित्सक की सलाह" : "Original veterinarian response"}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-base">{shown.provisional_diagnosis}</strong>
          <div className="flex items-center gap-2">{a.priority && <RiskBadge level={a.priority} />}<SpeakButton key={`${lang}-${Boolean(content)}`} text={speech} /></div>
        </div>
        {shown.medications.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs">
          <thead className="text-muted-foreground"><tr><th className="py-1 pr-2">{hi ? "दवा" : "Medicine"}</th><th className="pr-2">{hi ? "मात्रा" : "Dose"}</th><th className="pr-2">{hi ? "कितनी बार" : "How often"}</th><th>{hi ? "कितने दिन" : "Duration"}</th></tr></thead>
          <tbody>{shown.medications.map((m, i) => <tr key={i} className="border-t"><td className="py-1 pr-2 font-medium">{m.name}</td><td className="pr-2">{m.dose}</td><td className="pr-2">{m.frequency}</td><td>{m.duration}</td></tr>)}</tbody>
        </table></div>}
        {shown.treatment && <p className="mt-2"><b>{hi ? "उपचार:" : "Treatment:"}</b> {shown.treatment}</p>}
        {shown.advice && <p className="mt-1"><b>{hi ? "सलाह:" : "Advice:"}</b> {shown.advice}</p>}
        {a.follow_up_date && <p className="mt-1"><b>{hi ? "अगली जाँच:" : "Follow-up:"}</b> {new Date(`${a.follow_up_date}T00:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-IN")}</p>}
      </>}
      <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString(hi ? "hi-IN" : "en-IN")}</p>
    </div>
  );
}