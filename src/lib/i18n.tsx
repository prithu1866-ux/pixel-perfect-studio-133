import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  tagline: { en: "Healthy Animals. Stronger Farmers. Earlier Action.", hi: "स्वस्थ पशु, सुरक्षित किसान, समय पर उपचार।" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  animals: { en: "My Animals", hi: "मेरे पशु" },
  report: { en: "Report Symptoms", hi: "लक्षण बताएँ" },
  reports: { en: "Reports", hi: "रिपोर्ट" },
  vaccinations: { en: "Vaccinations", hi: "टीकाकरण" },
  knowledge: { en: "Disease Guide", hi: "रोग जानकारी" },
  vetQueue: { en: "Case Queue", hi: "केस सूची" },
  signOut: { en: "Sign out", hi: "लॉग आउट" },
  signIn: { en: "Sign in", hi: "लॉग इन" },
  getStarted: { en: "Get started", hi: "शुरू करें" },
  addAnimal: { en: "Add animal", hi: "पशु जोड़ें" },
  save: { en: "Save", hi: "सहेजें" },
  cancel: { en: "Cancel", hi: "रद्द करें" },
  submit: { en: "Submit report", hi: "रिपोर्ट भेजें" },
  offline: { en: "Offline — saving on this phone", hi: "ऑफ़लाइन — फ़ोन में सहेजा जा रहा है" },
  pendingSync: { en: "waiting to sync", hi: "भेजने के लिए बाकी" },
  speak: { en: "Speak", hi: "बोलें" },
  listening: { en: "Listening…", hi: "सुन रहे हैं…" },
  readAloud: { en: "Read aloud", hi: "सुनाएँ" },
  low: { en: "Low risk", hi: "कम जोखिम" },
  medium: { en: "Needs attention", hi: "ध्यान दें" },
  high: { en: "High risk", hi: "उच्च जोखिम" },
  urgent: { en: "Urgent", hi: "तुरंत" },
  disclaimer: {
    en: "VETSENSE gives guidance, not a diagnosis. Always confirm with a qualified veterinarian.",
    hi: "VETSENSE केवल मार्गदर्शन देता है, निदान नहीं। हमेशा पशु चिकित्सक से पुष्टि करें।",
  },
} satisfies Record<string, Record<Lang, string>>;

export type DictKey = keyof typeof dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string; pick: (b: { en: string; hi: string }) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("vetsense-lang");
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("vetsense-lang", l);
  };
  return (
    <I18nCtx.Provider value={{ lang, setLang, t: (k) => dict[k][lang], pick: (b) => b[lang] }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
