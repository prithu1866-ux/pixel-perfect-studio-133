import { createParser } from "eventsource-parser";
import { supabase } from "@/integrations/supabase/client";

const DEVANAGARI = /[\u0900-\u097F]/;

/** Language of the text itself (not the UI switch) — Hindi if it has Devanagari letters. */
export function textLang(text: string): "hi" | "en" {
  return DEVANAGARI.test(text) ? "hi" : "en";
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const now = speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 800);
  });
}

async function browserVoice(lang: "hi" | "en") {
  if (!("speechSynthesis" in window)) return null;
  const voices = await loadVoices();
  const want = lang === "hi" ? ["hi-in", "hi"] : ["en-in", "en-gb", "en-us", "en"];
  for (const w of want) {
    const v = voices.find((x) => x.lang.toLowerCase().replace("_", "-").startsWith(w));
    if (v) return v;
  }
  return null;
}

function decodePCM(pending: Uint8Array, incoming: Uint8Array) {
  const bytes = new Uint8Array(pending.length + incoming.length);
  bytes.set(pending);
  bytes.set(incoming, pending.length);
  const usable = bytes.length - (bytes.length % 2);
  const view = new DataView(bytes.buffer);
  const samples = new Float32Array(usable / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
  return { samples, pending: bytes.slice(usable) };
}

async function aiSpeak(text: string, signal: AbortSignal) {
  const context = new AudioContext({ sampleRate: 24000 });
  const sources = new Set<AudioBufferSourceNode>();
  const stopAll = () => sources.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } });
  signal.addEventListener("abort", stopAll, { once: true });
  let playhead = 0;
  let pending = new Uint8Array(0);
  let completed = false;
  let played = 0;
  let playback: Promise<void> = Promise.resolve();
  try {
    if (context.state === "suspended") await context.resume();
    const { data } = await supabase.auth.getSession();
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`speech ${res.status}`);
    const parser = createParser({
      onEvent(ev) {
        const p = JSON.parse(ev.data) as { type: string; audio?: string; error?: unknown };
        if (p.type === "error" || p.error) throw new Error("speech failed");
        if (p.type === "speech.audio.done") { completed = true; return; }
        if (p.type !== "speech.audio.delta" || !p.audio) return;
        const d = decodePCM(pending, Uint8Array.from(atob(p.audio), (c) => c.charCodeAt(0)));
        pending = new Uint8Array(d.pending);
        if (!d.samples.length) return;
        played += d.samples.length;
        const buf = context.createBuffer(1, d.samples.length, 24000);
        buf.copyToChannel(d.samples, 0);
        const src = context.createBufferSource();
        src.buffer = buf;
        src.connect(context.destination);
        sources.add(src);
        playback = new Promise<void>((r) => { src.onended = () => { sources.delete(src); r(); }; });
        playhead = Math.max(playhead, context.currentTime + 0.05);
        src.start(playhead);
        playhead += buf.duration;
      },
    });
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const n = await reader.read();
      if (n.done) break;
      parser.feed(n.value);
    }
    if (!completed || !played) throw new Error("incomplete speech");
    await playback;
  } finally {
    signal.removeEventListener("abort", stopAll);
    stopAll();
    await context.close();
  }
}

/**
 * Read text aloud in its own language. Uses the device voice when one exists for
 * that language; otherwise (common for Hindi on desktops) uses AI speech.
 */
export async function speak(text: string, signal: AbortSignal): Promise<void> {
  const lang = textLang(text);
  const voice = await browserVoice(lang);
  if (voice) {
    speechSynthesis.cancel();
    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.95;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      signal.addEventListener("abort", () => { speechSynthesis.cancel(); resolve(); }, { once: true });
      speechSynthesis.speak(u);
    });
    return;
  }
  await aiSpeak(text, signal);
}
