/**
 * Type-only export of AppRouter
 * 
 * This file is used by admin to get the AppRouter type without importing
 * the implementation (which contains firebase-admin, drizzle-orm, etc.)
 */

import { z } from "zod";
import { initTRPC } from "@trpc/server";
import type { TrpcContext } from "./_core/context";
import * as schemas from "@repo/api";

// Re-export schemas from @repo/api
export { schemas };

// Create tRPC instance for type inference only
const t = initTRPC.context<TrpcContext>().create();

// Define router structure for type inference
export const appRouterType = t.router({
  system: t.router({}),
  auth: t.router({
    me: t.procedure.query(async () => null),
    register: t.procedure
      .input(schemas.registerInputSchema)
      .output(schemas.authRegisterOutputSchema)
      .mutation(async () => ({ user: {} as any })),
    login: t.procedure
      .input(schemas.loginInputSchema)
      .output(schemas.authLoginOutputSchema)
      .mutation(async () => ({ user: {} as any })),
    logout: t.procedure
      .output(schemas.authLogoutOutputSchema)
      .mutation(async () => ({ success: true as const })),
  }),
  users: t.router({
    list: t.procedure.query(async () => []),
    get: t.procedure
      .input(schemas.getUserInputSchema)
      .query(async () => ({})),
    updateRole: t.procedure
      .input(schemas.updateUserRoleInputSchema)
      .output(schemas.updateUserRoleOutputSchema)
      .mutation(async () => ({ success: true as const })),
  }),
  devices: t.router({
    list: t.procedure.query(async () => []),
    get: t.procedure
      .input(schemas.getDeviceInputSchema)
      .query(async () => ({})),
    create: t.procedure
      .input(schemas.createDeviceInputSchema)
      .mutation(async () => ({})),
    updateStatus: t.procedure
      .input(schemas.updateDeviceStatusInputSchema)
      .output(schemas.updateDeviceStatusOutputSchema)
      .mutation(async () => ({ success: true as const })),
    delete: t.procedure
      .input(schemas.deleteDeviceInputSchema)
      .output(schemas.deleteDeviceOutputSchema)
      .mutation(async () => ({ success: true as const })),
    available: t.procedure.query(async () => []),
    byUser: t.procedure
      .input(schemas.getDevicesByUserInputSchema)
      .query(async () => []),
    csv: t.procedure.query(async () => ""),
  }),
  rentalHistory: t.router({
    list: t.procedure.query(async () => []),
    record: t.procedure
      .input(schemas.recordRentalInputSchema)
      .output(schemas.recordRentalOutputSchema)
      .mutation(async () => ({ success: true as const })),
    return: t.procedure
      .input(schemas.returnRentalInputSchema)
      .output(schemas.returnRentalOutputSchema)
      .mutation(async () => ({ success: true as const })),
    delete: t.procedure
      .input(schemas.deleteRentalHistoryInputSchema)
      .output(schemas.deleteRentalHistoryOutputSchema)
      .mutation(async () => ({ success: true as const })),
  }),
});

export type AppRouter = typeof appRouterType;
