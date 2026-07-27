import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  activateCustomerSubscription,
  findCustomerByEmailOrPhone,
  isAdminUnlocked,
  lockAdminPanel,
  unlockAdminPanel,
} from "./admin.server";

export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => ({
  unlocked: await isAdminUnlocked(),
}));

export const signInAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ password: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => unlockAdminPanel(data.password));

export const signOutAdmin = createServerFn({ method: "POST" }).handler(async () => lockAdminPanel());

export const searchAdminCustomer = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ search: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => findCustomerByEmailOrPhone(data.search));

export const activateAdminCustomerPlan = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        userId: z.string().uuid(),
        days: z.number().int().positive().max(3660),
        planName: z.string().min(1).max(80),
      })
      .parse(data),
  )
  .handler(async ({ data }) => activateCustomerSubscription(data));