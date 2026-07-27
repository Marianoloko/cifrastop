import { createHash, timingSafeEqual } from "node:crypto";
import { useSession } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AdminSession = { unlocked?: boolean };

type CustomerRow = {
  id: string;
  email: string | null;
  phone: string | null;
  trial_started_at: string;
  created_at: string;
};

function getAdminSessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password) throw new Error("ADMIN_SESSION_SECRET não está configurado.");
  return {
    password,
    name: "cifrastop-admin",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

async function getAdminSession() {
  return useSession<AdminSession>(getAdminSessionConfig());
}

export async function isAdminUnlocked() {
  const session = await getAdminSession();
  return Boolean(session.data.unlocked);
}

export async function unlockAdminPanel(password: string) {
  const expected = process.env.ADMIN_PANEL_PASSWORD;
  if (!expected) throw new Error("ADMIN_PANEL_PASSWORD não está configurado.");

  if (!passwordMatches(password, expected)) return { ok: false as const };

  const session = await getAdminSession();
  await session.update({ unlocked: true });
  return { ok: true as const };
}

export async function lockAdminPanel() {
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
}

async function requireAdminPanel() {
  const unlocked = await isAdminUnlocked();
  if (!unlocked) throw new Error("Acesso administrativo não autorizado.");
}

export async function findCustomerByEmailOrPhone(search: string) {
  await requireAdminPanel();

  const term = search.trim();
  if (!term) return null;

  const isEmail = term.includes("@");
  const phoneDigits = term.replace(/\D/g, "");

  let query = supabaseAdmin
    .from("profiles")
    .select("id,email,phone,trial_started_at,created_at")
    .limit(1);

  if (isEmail) query = query.ilike("email", term.toLowerCase());
  else if (phoneDigits) query = query.ilike("phone", `%${phoneDigits}%`);
  else query = query.ilike("phone", `%${term}%`);

  const { data, error } = await query.maybeSingle<CustomerRow>();
  if (error) throw error;
  return data;
}

export async function activateCustomerSubscription(input: { userId: string; days: number; planName: string }) {
  await requireAdminPanel();

  const currentPeriodEnd = new Date();
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + input.days);

  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: input.userId,
      status: "active",
      current_period_end: currentPeriodEnd.toISOString(),
      stripe_subscription_id: input.planName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
  return { ok: true as const, currentPeriodEnd: currentPeriodEnd.toISOString() };
}