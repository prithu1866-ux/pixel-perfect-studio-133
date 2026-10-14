import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function ForgotPasswordLink({ email }: { email: string }) {
  const { lang } = useI18n();
  const hi = lang === "hi";
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!email) {
      toast.error(hi ? "पहले अपना ईमेल लिखें।" : "Enter your email above first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(hi ? "पासवर्ड बदलने का लिंक ईमेल पर भेजा गया।" : "Password reset link sent. Check your email.");
  };
  return (
    <button type="button" onClick={send} disabled={busy} className="text-sm text-primary hover:underline disabled:opacity-50">
      {hi ? "पासवर्ड भूल गए?" : "Forgot password?"}
    </button>
  );
}
