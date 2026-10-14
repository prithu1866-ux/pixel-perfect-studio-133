import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — VETSENSE AI" },
      { name: "description", content: "Choose a new password for your VETSENSE AI account." },
      { property: "og:title", content: "Reset password — VETSENSE AI" },
      { property: "og:description", content: "Set a new password for your farmer or vet account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { lang } = useI18n();
  const hi = lang === "hi";
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange((e) => {
      if (e === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) return toast.error(hi ? "पासवर्ड मेल नहीं खाते।" : "Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(hi ? "पासवर्ड बदल गया।" : "Password updated.");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 w-full max-w-md"><Logo /></div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-card">
        <h1 className="text-2xl font-semibold">{hi ? "नया पासवर्ड चुनें" : "Choose a new password"}</h1>
        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">{hi ? "कृपया ईमेल में भेजा गया लिंक खोलें।" : "Please open this page from the reset link in your email."}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label>{hi ? "नया पासवर्ड" : "New password"}</Label><Input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div><Label>{hi ? "पासवर्ड दोबारा" : "Confirm password"}</Label><Input type="password" required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={busy}>{hi ? "पासवर्ड बदलें" : "Update password"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
