import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ForgotPasswordLink } from "@/components/ForgotPassword";
import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/vet-login")({
  head: () => ({
    meta: [
      { title: "Veterinarian portal — VETSENSE AI" },
      { name: "description", content: "Sign-in for veterinarians to review farmer reports and prescribe care." },
      { property: "og:title", content: "Veterinarian portal — VETSENSE AI" },
      { property: "og:description", content: "Review livestock cases by priority and send treatment advice." },
    ],
  }),
  component: VetLogin,
});

function VetLogin() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ email: "", password: "", full_name: "", district: "", state: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email: f.email, password: f.password,
          options: { emailRedirectTo: `${window.location.origin}/vet-login`, data: { full_name: f.full_name, district: f.district, state: f.state, requested_role: "veterinarian" } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your veterinarian account.");
        setMode("in");
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (!roles?.some((r) => r.role === "veterinarian")) {
        await supabase.auth.signOut();
        toast.error("This account is not registered as a veterinarian. Farmers should use the main sign-in.");
        return;
      }
      nav({ to: "/vet" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground md:flex">
        <Logo inverted />
        <div>
          <Stethoscope className="size-12 text-leaf" />
          <h1 className="mt-4 text-4xl font-semibold text-sidebar-foreground">Veterinarian portal</h1>
          <p className="mt-3 max-w-md text-sidebar-foreground/80">Review farmer reports sorted by urgency, see triage and AI analysis, and send diagnoses, medications and follow-ups.</p>
        </div>
        <p className="text-sm text-sidebar-foreground/60">For registered veterinary professionals only.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-card">
          <div className="mb-4 md:hidden"><Logo /></div>
          <h2 className="text-2xl font-semibold">{mode === "in" ? "Vet sign in" : "Register as veterinarian"}</h2>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "up" && (
              <>
                <div><Label>Full name</Label><Input required value={f.full_name} onChange={set("full_name")} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>District</Label><Input value={f.district} onChange={set("district")} /></div>
                  <div><Label>State</Label><Input value={f.state} onChange={set("state")} /></div>
                </div>
              </>
            )}
            <div><Label>Email</Label><Input type="email" required value={f.email} onChange={set("email")} /></div>
            <div><Label>Password</Label><Input type="password" required minLength={6} value={f.password} onChange={set("password")} /></div>
            {mode === "in" && <div className="text-right"><ForgotPasswordLink email={f.email} /></div>}
            <Button type="submit" size="lg" className="h-11 w-full" disabled={busy}>{mode === "in" ? "Sign in to portal" : "Create vet account"}</Button>
          </form>
          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-5 w-full text-center text-sm text-primary hover:underline">
            {mode === "in" ? "New veterinarian? Register" : "Already registered? Sign in"}
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">Farmer? <Link to="/auth" className="text-primary">Use the farmer sign-in</Link></p>
        </div>
      </div>
    </div>
  );
}
