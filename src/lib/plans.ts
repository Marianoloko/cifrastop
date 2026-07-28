import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_NUMBER = "5598987150431";

export type Plan = {
  id: string;
  name: string;
  description: string;
  price_label: string;
  period_label: string;
  duration_days: number;
  badge: string | null;
  featured: boolean;
  whatsapp_message: string;
  features: string[];
  rules: Record<string, string | number | boolean>;
  active: boolean;
  sort_order: number;
};

function normalize(row: any): Plan {
  return {
    ...row,
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    rules: (row.rules ?? {}) as Record<string, string | number | boolean>,
  };
}

export async function fetchPlans(includeInactive = false): Promise<Plan[]> {
  let query = supabase.from("plans").select("*").order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message: string) {
  window.open(whatsappLink(message), "_blank", "noopener");
}
