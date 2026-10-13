import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — VETSENSE AI" },
      { name: "description", content: "Sign in or create your VETSENSE AI account as a farmer or veterinarian." },
      { property: "og:title", content: "Sign in — VETSENSE AI" },
      { property: "og:description", content: "Access your livestock records and veterinary cases." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { lang } = useI18n();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", district: "", state: "", role: "farmer" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && nav({ to: "/dashboard" }));
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) nav({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.full_name, district: form.district, state: form.state, requested_role: form.role, preferred_language: lang },
          },
        });
        if (error) throw error;
        toast.success(lang === "hi" ? "ईमेल देखें और खाते की पुष्टि करें।" : "Check your email to confirm your account.");
        setMode("in");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex w-full max-w-md items-center justify-between"><Logo /><LangToggle /></div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-card">
        <h1 className="text-2xl font-semibold">{mode === "in" ? (lang === "hi" ? "वापस स्वागत है" : "Welcome back") : lang === "hi" ? "खाता बनाएँ" : "Create your account"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "up" && (
            <>
              <div><Label>{lang === "hi" ? "पूरा नाम" : "Full name"}</Label><Input required value={form.full_name} onChange={set("full_name")} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{lang === "hi" ? "ज़िला" : "District"}</Label><Input value={form.district} onChange={set("district")} /></div>
                <div><Label>{lang === "hi" ? "राज्य" : "State"}</Label><Input value={form.state} onChange={set("state")} /></div>
              </div>
              <div>
                <Label>{lang === "hi" ? "मैं हूँ" : "I am a"}</Label>
                <select value={form.role} onChange={set("role")} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="farmer">{lang === "hi" ? "पशुपालक" : "Farmer"}</option>
                  <option value="veterinarian">{lang === "hi" ? "पशु चिकित्सक" : "Veterinarian"}</option>
                  <option value="field_worker">{lang === "hi" ? "पशु मित्र / फ़ील्ड कार्यकर्ता" : "Field / para-vet worker"}</option>
                </select>
              </div>
            </>
          )}
          <div><Label>Email</Label><Input type="email" required value={form.email} onChange={set("email")} /></div>
          <div><Label>{lang === "hi" ? "पासवर्ड" : "Password"}</Label><Input type="password" required minLength={6} value={form.password} onChange={set("password")} /></div>
          <Button type="submit" size="lg" className="h-11 w-full" disabled={busy}>{mode === "in" ? (lang === "hi" ? "लॉग इन" : "Sign in") : lang === "hi" ? "खाता बनाएँ" : "Create account"}</Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
        <Button variant="outline" size="lg" className="h-11 w-full" onClick={google}>Continue with Google</Button>
        <p className="mt-4 text-center text-sm text-muted-foreground">Veterinarian? <Link to="/vet-login" className="text-primary">Open the vet portal</Link></p>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-5 w-full text-center text-sm text-primary hover:underline">
          {mode === "in" ? (lang === "hi" ? "नया खाता बनाएँ" : "New here? Create an account") : lang === "hi" ? "पहले से खाता है? लॉग इन" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
