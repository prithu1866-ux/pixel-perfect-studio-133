import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — VETSENSE AI" }, { name: "description", content: "Updates on your reports." }, { property: "og:title", content: "Notifications — VETSENSE AI" }, { property: "og:description", content: "Updates on your reports." }] }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  useEffect(() => {
    if (!user || !data.some((n) => !n.read)) return;
    supabase.from("notifications").update({ read: true }).eq("read", false).eq("user_id", user.id).then(() => qc.invalidateQueries({ queryKey: ["dashboard"] }));
  }, [data, user, qc]);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Notifications</h1>
      <ul className="divide-y rounded-2xl border bg-card shadow-card">
        {data.length === 0 && <li className="p-6 text-center text-muted-foreground">No notifications.</li>}
        {data.map((n) => (
          <li key={n.id} className={`p-4 ${n.read ? "" : "bg-secondary/50"}`}>
            {n.link ? <Link to={n.link as "/"} className="font-medium hover:text-primary">{n.title}</Link> : <span className="font-medium">{n.title}</span>}
            {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
            <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
