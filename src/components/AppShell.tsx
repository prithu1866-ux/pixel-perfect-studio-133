import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, BookOpen, ClipboardList, HeartPulse, LayoutDashboard, LogOut, PawPrint, Stethoscope, Syringe, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { getQueue, syncQueue } from "@/lib/offline";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex rounded-full border bg-card p-0.5 text-xs font-semibold">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-3 py-1 ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user, isVet } = useAuth();
  const nav = useNavigate();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const refresh = () => setPending(getQueue().length);
    const goOnline = async () => {
      setOnline(true);
      const n = await syncQueue();
      if (n) toast.success(`${n} offline report(s) synced`);
      refresh();
    };
    setOnline(navigator.onLine);
    refresh();
    goOnline();
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", () => setOnline(false));
    window.addEventListener("vetsense-queue", refresh);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("vetsense-queue", refresh);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false).then(({ count }) => setUnread(count ?? 0));
  }, [user]);

  const links = [
    { to: "/dashboard", label: t("dashboard"), Icon: LayoutDashboard },
    { to: "/animals", label: t("animals"), Icon: PawPrint },
    { to: "/report", label: t("report"), Icon: HeartPulse },
    { to: "/reports", label: t("reports"), Icon: ClipboardList },
    { to: "/vaccinations", label: t("vaccinations"), Icon: Syringe },
    ...(isVet ? [{ to: "/vet", label: t("vetQueue"), Icon: Stethoscope }] : []),
    { to: "/knowledge", label: t("knowledge"), Icon: BookOpen },
  ] as const;

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <Logo inverted />
        <nav className="mt-8 flex flex-col gap-1">
          {links.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            nav({ to: "/" });
          }}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" /> {t("signOut")}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
          <div className="md:hidden"><Logo /></div>
          <div className="hidden text-sm text-muted-foreground md:block">{user?.email}{isVet && " · Veterinarian"}</div>
          <div className="flex items-center gap-2">
            {(!online || pending > 0) && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-offline/15 px-3 py-1 text-xs font-medium text-foreground">
                <WifiOff className="size-3.5" />
                {!online ? t("offline") : `${pending} ${t("pendingSync")}`}
              </span>
            )}
            <Link to="/notifications" className="relative rounded-full p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-destructive-foreground">{unread}</span>}
            </Link>
            <LangToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-card md:hidden">
        {links.slice(0, 5).map(({ to, label, Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }}>
            <Icon className="size-5" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
