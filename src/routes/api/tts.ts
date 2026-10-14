import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Text-to-speech for read-aloud (mainly Hindi, which many browsers can't speak).
// Signed-in users only; returns the gateway's SSE audio stream untouched.
export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env["SUPABASE_URL"];
        const pub = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const key = process.env["LOVABLE_API_KEY"];
        if (!url || !pub || !key) return new Response("Speech is not configured.", { status: 500 });

        const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
        if (token.split(".").length !== 3) return new Response("Unauthorized", { status: 401 });
        const sb = createClient(url, pub, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data: claims, error } = await sb.auth.getClaims(token);
        if (error || !claims?.claims?.sub) return new Response("Unauthorized", { status: 401 });

        let text = "";
        try {
          const body = (await request.json()) as { text?: unknown };
          text = typeof body.text === "string" ? body.text.trim().slice(0, 1500) : "";
        } catch { /* invalid json */ }
        if (!text) return new Response("No text", { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: `Read slowly and clearly for a farmer: ${text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
            },
            stream_format: "sse",
          }),
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
