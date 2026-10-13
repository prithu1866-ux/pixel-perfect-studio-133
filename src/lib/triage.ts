/**
 * VETSENSE AI rule-based triage engine (v1).
 * Transparent, documented rules — decision support only, NOT a diagnosis.
 *
 * Rules:
 * 1. Red-flag signs (breathing difficulty, convulsions, unable to stand, sudden deaths,
 *    temperature >= 41°C) => URGENT regardless of score.
 * 2. Each symptom carries a weight (1–3). Score = sum of weights.
 * 3. Modifiers: temp >= 39.5°C +2; duration >= 3 days +1; 3+ animals affected +3 (possible cluster).
 * 4. Disease patterns: a pattern "matches" when >= 50% of its key signs are present
 *    AND the species is susceptible. A notifiable-disease match raises level to at least HIGH.
 * 5. Levels: URGENT (red flag) | HIGH (score >= 8 or notifiable match) | MEDIUM (score >= 3) | LOW.
 */

export type Species = "cattle" | "buffalo" | "goat" | "sheep" | "pig" | "poultry";
export type RiskLevel = "low" | "medium" | "high" | "urgent";
export type Bi = { en: string; hi: string };

export const SPECIES: { id: Species; en: string; hi: string }[] = [
  { id: "cattle", en: "Cattle", hi: "गाय / बैल" },
  { id: "buffalo", en: "Buffalo", hi: "भैंस" },
  { id: "goat", en: "Goat", hi: "बकरी" },
  { id: "sheep", en: "Sheep", hi: "भेड़" },
  { id: "pig", en: "Pig", hi: "सूअर" },
  { id: "poultry", en: "Poultry", hi: "मुर्गी" },
];

export const SYMPTOMS: { id: string; en: string; hi: string; weight: number; redFlag?: boolean; keywords: string[] }[] = [
  { id: "fever", en: "Fever / feels hot", hi: "बुखार", weight: 2, keywords: ["fever", "बुखार", "गरम", "ताप"] },
  { id: "not_eating", en: "Not eating", hi: "चारा नहीं खा रहा", weight: 1, keywords: ["not eating", "खाना नहीं", "चारा नहीं", "खा नहीं"] },
  { id: "milk_drop", en: "Sudden milk drop", hi: "दूध अचानक कम", weight: 1, keywords: ["milk", "दूध"] },
  { id: "drooling", en: "Excess drooling", hi: "ज़्यादा लार", weight: 2, keywords: ["drool", "लार"] },
  { id: "mouth_blisters", en: "Blisters / sores in mouth", hi: "मुँह में छाले", weight: 3, keywords: ["blister", "छाले", "छाला", "mouth sore"] },
  { id: "foot_lesions", en: "Foot / hoof wounds", hi: "खुर में घाव", weight: 3, keywords: ["hoof", "खुर", "foot"] },
  { id: "lameness", en: "Limping / lameness", hi: "लंगड़ाना", weight: 2, keywords: ["limp", "लंगड़", "lame"] },
  { id: "skin_nodules", en: "Lumps / nodules on skin", hi: "त्वचा पर गांठें", weight: 3, keywords: ["lump", "nodule", "गांठ"] },
  { id: "swollen_lymph", en: "Swollen glands", hi: "गिल्टी सूजन", weight: 2, keywords: ["swollen", "सूजन", "गिल्टी"] },
  { id: "nasal_discharge", en: "Nasal discharge", hi: "नाक से पानी", weight: 1, keywords: ["nose", "नाक"] },
  { id: "eye_discharge", en: "Eye discharge", hi: "आँख से पानी", weight: 1, keywords: ["eye", "आँख", "आंख"] },
  { id: "cough", en: "Coughing", hi: "खांसी", weight: 1, keywords: ["cough", "खांसी", "खाँसी"] },
  { id: "diarrhoea", en: "Diarrhoea", hi: "दस्त", weight: 2, keywords: ["diarr", "दस्त", "पतला गोबर"] },
  { id: "red_skin", en: "Red / purple skin patches", hi: "त्वचा पर लाल धब्बे", weight: 2, keywords: ["red patch", "लाल धब्बे", "धब्बे"] },
  { id: "abortion", en: "Abortion / stillbirth", hi: "गर्भपात", weight: 3, keywords: ["abort", "गर्भपात", "बच्चा गिर"] },
  { id: "retained_placenta", en: "Retained placenta", hi: "जेर न गिरना", weight: 2, keywords: ["placenta", "जेर"] },
  { id: "swollen_joints", en: "Swollen joints / testicles", hi: "जोड़ों में सूजन", weight: 1, keywords: ["joint", "जोड़"] },
  { id: "breathing_difficulty", en: "Difficulty breathing", hi: "सांस लेने में तकलीफ़", weight: 3, redFlag: true, keywords: ["breath", "सांस", "साँस"] },
  { id: "convulsions", en: "Convulsions / shaking", hi: "दौरे / कंपकंपी", weight: 3, redFlag: true, keywords: ["convuls", "दौरा", "दौरे"] },
  { id: "unable_to_stand", en: "Cannot stand up", hi: "खड़ा नहीं हो पा रहा", weight: 3, redFlag: true, keywords: ["cannot stand", "खड़ा नहीं", "उठ नहीं"] },
  { id: "sudden_death", en: "Sudden deaths in herd", hi: "झुंड में अचानक मौत", weight: 3, redFlag: true, keywords: ["death", "died", "मौत", "मर"] },
];

export type Disease = {
  id: string;
  name: Bi;
  species: Species[];
  signs: string[];
  notifiable: boolean;
  summary: Bi;
  prevention: Bi;
};

export const DISEASES: Disease[] = [
  {
    id: "fmd",
    name: { en: "Foot-and-Mouth Disease (FMD)", hi: "खुरपका-मुंहपका रोग" },
    species: ["cattle", "buffalo", "goat", "sheep", "pig"],
    signs: ["fever", "mouth_blisters", "foot_lesions", "drooling", "lameness", "milk_drop"],
    notifiable: true,
    summary: { en: "Highly contagious viral disease causing blisters in the mouth and feet, fever and a sharp fall in milk.", hi: "अत्यधिक संक्रामक वायरल रोग — मुँह और खुर में छाले, बुखार और दूध में भारी कमी।" },
    prevention: { en: "Vaccinate every 6 months (NADCP). Isolate sick animals, disinfect sheds, restrict movement.", hi: "हर 6 महीने टीका लगवाएँ। बीमार पशु को अलग रखें, बाड़ा कीटाणुरहित करें।" },
  },
  {
    id: "lsd",
    name: { en: "Lumpy Skin Disease (LSD)", hi: "लम्पी त्वचा रोग" },
    species: ["cattle", "buffalo"],
    signs: ["fever", "skin_nodules", "swollen_lymph", "nasal_discharge", "eye_discharge", "milk_drop"],
    notifiable: true,
    summary: { en: "Viral disease spread by biting insects; firm skin nodules, fever and swollen glands.", hi: "मक्खी-मच्छर से फैलने वाला वायरल रोग; त्वचा पर सख्त गांठें, बुखार।" },
    prevention: { en: "Goat-pox vaccine as advised, insect control, isolate affected animals.", hi: "सलाह अनुसार टीका, मक्खी-मच्छर नियंत्रण, पशु को अलग रखें।" },
  },
  {
    id: "ppr",
    name: { en: "Peste des Petits Ruminants (PPR)", hi: "पीपीआर (बकरी प्लेग)" },
    species: ["goat", "sheep"],
    signs: ["fever", "nasal_discharge", "eye_discharge", "mouth_blisters", "diarrhoea", "cough"],
    notifiable: true,
    summary: { en: "Severe viral disease of goats and sheep with fever, discharges, mouth sores and diarrhoea.", hi: "बकरी-भेड़ का गंभीर वायरल रोग — बुखार, नाक-आँख से स्राव, मुँह के छाले, दस्त।" },
    prevention: { en: "Single PPR vaccination gives long immunity. Quarantine new animals for 21 days.", hi: "पीपीआर टीका लंबी सुरक्षा देता है। नए पशु को 21 दिन अलग रखें।" },
  },
  {
    id: "csf",
    name: { en: "Classical Swine Fever (CSF)", hi: "स्वाइन फीवर" },
    species: ["pig"],
    signs: ["fever", "not_eating", "red_skin", "diarrhoea", "convulsions"],
    notifiable: true,
    summary: { en: "Contagious viral disease of pigs with high fever, red/purple skin patches and nervous signs.", hi: "सूअरों का संक्रामक रोग — तेज़ बुखार, त्वचा पर लाल-बैंगनी धब्बे।" },
    prevention: { en: "Vaccinate piglets, avoid swill feeding, strict farm biosecurity.", hi: "बच्चों का टीकाकरण, जूठन न खिलाएँ, फ़ार्म की सख्त सुरक्षा।" },
  },
  {
    id: "brucellosis",
    name: { en: "Brucellosis", hi: "ब्रुसेलोसिस" },
    species: ["cattle", "buffalo", "goat", "sheep", "pig"],
    signs: ["abortion", "retained_placenta", "swollen_joints", "milk_drop"],
    notifiable: true,
    summary: { en: "Bacterial disease causing late-pregnancy abortion; can spread to humans through raw milk.", hi: "जीवाणु रोग — गर्भ के अंतिम चरण में गर्भपात; कच्चे दूध से इंसानों में फैल सकता है।" },
    prevention: { en: "Vaccinate female calves (4–8 months). Wear gloves for births, boil milk.", hi: "मादा बछड़ियों (4–8 माह) का टीका। ब्यांत में दस्ताने पहनें, दूध उबालें।" },
  },
];

export type TriageInput = {
  species: Species;
  symptoms: string[];
  temperatureC?: number | null;
  durationDays?: number | null;
  affectedCount?: number | null;
};

export type TriageResult = {
  level: RiskLevel;
  score: number;
  reasons: Bi[];
  suspected: string[]; // disease ids
  guidance: Bi[];
};

export function runTriage(input: TriageInput): TriageResult {
  const reasons: Bi[] = [];
  let score = 0;
  let redFlag = false;

  for (const id of input.symptoms) {
    const s = SYMPTOMS.find((x) => x.id === id);
    if (!s) continue;
    score += s.weight;
    if (s.redFlag) {
      redFlag = true;
      reasons.push({ en: `Red-flag sign: ${s.en}`, hi: `गंभीर लक्षण: ${s.hi}` });
    }
  }
  const t = input.temperatureC ?? null;
  if (t != null && t >= 41) {
    redFlag = true;
    reasons.push({ en: `Very high temperature (${t}°C)`, hi: `बहुत तेज़ बुखार (${t}°C)` });
  } else if (t != null && t >= 39.5) {
    score += 2;
    reasons.push({ en: `Raised temperature (${t}°C)`, hi: `बुखार (${t}°C)` });
  }
  if ((input.durationDays ?? 0) >= 3) {
    score += 1;
    reasons.push({ en: "Symptoms for 3+ days", hi: "3+ दिनों से लक्षण" });
  }
  if ((input.affectedCount ?? 1) >= 3) {
    score += 3;
    reasons.push({ en: `${input.affectedCount} animals affected — possible spread`, hi: `${input.affectedCount} पशु प्रभावित — फैलाव संभव` });
  }

  const suspected: string[] = [];
  let notifiableMatch = false;
  for (const d of DISEASES) {
    if (!d.species.includes(input.species)) continue;
    const hits = d.signs.filter((s) => input.symptoms.includes(s)).length;
    if (hits >= 2 && hits / d.signs.length >= 0.5) {
      suspected.push(d.id);
      if (d.notifiable) notifiableMatch = true;
      reasons.push({ en: `Signs consistent with ${d.name.en} (${hits}/${d.signs.length})`, hi: `${d.name.hi} से मिलते लक्षण (${hits}/${d.signs.length})` });
    }
  }

  let level: RiskLevel = "low";
  if (redFlag) level = "urgent";
  else if (score >= 8 || notifiableMatch) level = "high";
  else if (score >= 3) level = "medium";

  const guidance: Bi[] = [];
  if (level === "urgent")
    guidance.push({ en: "Call a veterinarian or the 1962 animal helpline now.", hi: "अभी पशु चिकित्सक या 1962 हेल्पलाइन पर कॉल करें।" });
  if (level === "high" || level === "urgent" || suspected.length)
    guidance.push({ en: "Separate the animal from the herd and avoid moving it to markets.", hi: "पशु को झुंड से अलग रखें, बाज़ार न ले जाएँ।" });
  guidance.push({ en: "Provide clean water, shade and soft feed.", hi: "साफ़ पानी, छाया और नरम चारा दें।" });
  guidance.push({ en: "Do not give antibiotics or other medicines without a vet's advice.", hi: "पशु चिकित्सक की सलाह के बिना दवा न दें।" });
  if (suspected.includes("brucellosis"))
    guidance.push({ en: "Wear gloves when handling birth material; boil milk before use.", hi: "ब्यांत सामग्री दस्ताने पहनकर छुएँ; दूध उबालकर पिएँ।" });

  return { level, score, reasons, suspected, guidance };
}

/** Map spoken text (Hindi or English) to symptom ids. */
export function symptomsFromSpeech(text: string): string[] {
  const t = text.toLowerCase();
  return SYMPTOMS.filter((s) => s.keywords.some((k) => t.includes(k.toLowerCase()))).map((s) => s.id);
}
