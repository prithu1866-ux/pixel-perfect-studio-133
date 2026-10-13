import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { RiskLevel } from "@/lib/triage";

const styles: Record<RiskLevel, { cls: string; Icon: typeof Info }> = {
  low: { cls: "bg-success/12 text-success border-success/30", Icon: CheckCircle2 },
  medium: { cls: "bg-warning/15 text-earth border-warning/40", Icon: Info },
  high: { cls: "bg-danger/10 text-danger border-danger/30", Icon: AlertTriangle },
  urgent: { cls: "bg-danger text-destructive-foreground border-danger", Icon: AlertOctagon },
};

export function RiskBadge({ level, className }: { level: string; className?: string }) {
  const { t } = useI18n();
  const l = (level in styles ? level : "low") as RiskLevel;
  const { cls, Icon } = styles[l];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", cls, className)}>
      <Icon className="size-3.5" />
      {t(l)}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const label: Record<string, string> = { submitted: "Submitted", under_review: "Under review", assessed: "Vet responded", closed: "Closed" };
  return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{label[status] ?? status}</span>;
}
