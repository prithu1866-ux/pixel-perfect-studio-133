import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

/**
 * Offline queue for symptom reports. Each report carries a client_id so
 * re-sending after a flaky connection never creates duplicates (unique column).
 */
const KEY = "vetsense-report-queue";
type Queued = TablesInsert<"symptom_reports"> & { client_id: string };

export function getQueue(): Queued[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function setQueue(q: Queued[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
  window.dispatchEvent(new Event("vetsense-queue"));
}
export function enqueue(r: Queued) {
  setQueue([...getQueue(), r]);
}

export async function sendReport(r: Queued): Promise<"sent" | "queued"> {
  if (!navigator.onLine) {
    enqueue(r);
    return "queued";
  }
  const { error } = await supabase.from("symptom_reports").upsert(r, { onConflict: "client_id", ignoreDuplicates: true });
  if (error) {
    if (/fetch|network/i.test(error.message)) {
      enqueue(r);
      return "queued";
    }
    throw error;
  }
  return "sent";
}

let syncing = false;
export async function syncQueue() {
  if (syncing || !navigator.onLine) return 0;
  syncing = true;
  let sent = 0;
  try {
    const remaining: Queued[] = [];
    for (const r of getQueue()) {
      const { error } = await supabase.from("symptom_reports").upsert(r, { onConflict: "client_id", ignoreDuplicates: true });
      if (error) remaining.push(r);
      else sent++;
    }
    setQueue(remaining);
  } finally {
    syncing = false;
  }
  return sent;
}
