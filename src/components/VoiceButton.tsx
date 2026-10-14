import { useRef, useState } from "react";
import { Loader2, Mic, MicOff, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { speak } from "@/lib/speech";
import { toast } from "sonner";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function VoiceButton({ onText }: { onText: (text: string) => void }) {
  const { t, lang } = useI18n();
  const [on, setOn] = useState(false);
  const rec = useRef<any>(null);

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error(lang === "hi" ? "यह ब्राउज़र आवाज़ सुविधा नहीं देता। Chrome आज़माएँ।" : "Voice input isn't supported in this browser. Try Chrome on Android.");
      return;
    }
    const r = new SR();
    r.lang = lang === "hi" ? "hi-IN" : "en-IN";
    r.interimResults = false;
    r.onresult = (e: any) => onText(Array.from(e.results).map((x: any) => x[0].transcript).join(" "));
    r.onerror = (e: any) => {
      if (e.error === "not-allowed") toast.error(lang === "hi" ? "माइक की अनुमति दें" : "Please allow microphone access");
    };
    r.onend = () => setOn(false);
    rec.current = r;
    r.start();
    setOn(true);
  };

  return (
    <Button type="button" variant={on ? "destructive" : "secondary"} size="lg" onClick={() => (on ? rec.current?.stop() : start())}>
      {on ? <MicOff /> : <Mic />}
      {on ? t("listening") : t("speak")}
    </Button>
  );
}

export function SpeakButton({ text }: { text: string }) {
  const { t, lang } = useI18n();
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const ctrl = useRef<AbortController | null>(null);

  const toggle = async () => {
    if (state !== "idle") {
      ctrl.current?.abort();
      setState("idle");
      return;
    }
    const c = new AbortController();
    ctrl.current = c;
    setState("loading");
    const playingTimer = setTimeout(() => !c.signal.aborted && setState("playing"), 400);
    try {
      await speak(text, c.signal);
    } catch {
      if (!c.signal.aborted) toast.error(lang === "hi" ? "आवाज़ नहीं चल सकी। फिर से कोशिश करें।" : "Couldn't play the audio. Please try again.");
    } finally {
      clearTimeout(playingTimer);
      if (ctrl.current === c) setState("idle");
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggle}>
      {state === "loading" ? <Loader2 className="animate-spin" /> : state === "playing" ? <Square /> : <Volume2 />}
      {state === "idle" ? t("readAloud") : lang === "hi" ? "रोकें" : "Stop"}
    </Button>
  );
}
