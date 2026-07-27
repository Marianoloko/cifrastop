import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TRIAL_MS = 2 * 60 * 60 * 1000; // 2 hours

export type AccessState =
  | { status: "loading" }
  | { status: "subscriber"; currentPeriodEnd: string | null }
  | { status: "trial"; remainingMs: number }
  | { status: "expired" };

export function useAccess(): AccessState {
  const { data, isLoading } = useQuery({
    queryKey: ["access"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;

      const [profileRes, subRes] = await Promise.all([
        supabase.from("profiles").select("trial_started_at").eq("id", uid).maybeSingle(),
        supabase.from("subscriptions").select("status,current_period_end").eq("user_id", uid).maybeSingle(),
      ]);

      return {
        trialStartedAt: profileRes.data?.trial_started_at as string | undefined,
        subscription: subRes.data as { status: string; current_period_end: string | null } | null,
      };
    },
    refetchInterval: 60_000,
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (isLoading || !data) return { status: "loading" };

  const sub = data.subscription;
  if (sub && sub.status === "active") {
    return { status: "subscriber", currentPeriodEnd: sub.current_period_end };
  }

  if (data.trialStartedAt) {
    const started = new Date(data.trialStartedAt).getTime();
    const remaining = started + TRIAL_MS - now;
    if (remaining > 0) return { status: "trial", remainingMs: remaining };
  }

  return { status: "expired" };
}

export function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
