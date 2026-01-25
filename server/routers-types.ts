/**
 * Type-only export of AppRouter
 * 
 * This file is used by admin to get the AppRouter type without importing
 * the implementation (which contains firebase-admin, drizzle-orm, etc.)
 * 
 * Key: We define a minimal context type here instead of importing from server/_core/context
 * to avoid pulling in server dependencies into the admin bundle.
 */

import { z } from "zod";
import { initTRPC } from "@trpc/server";

// Minimal context type for type inference only
// This mirrors TrpcContext but without importing server internals
type MinimalContext = {
  user: {
    id: number;
    openId: string;
    email: string | null;
    name: string | null;
    role: "user" | "admin";
  } | null;
};

// Create tRPC instance for type inference only
const t = initTRPC.context<MinimalContext>().create();

// Define router structure for type inference
export const appRouterType = t.router({
  system: t.router({}),
  auth: t.router({
    me: t.procedure.query(async () => null),
    register: t.procedure
      .input(z.any())
      .output(z.any())
      .mutation(async () => ({ user: {} as any })),
    login: t.procedure
      .input(z.any())
      .output(z.any())
      .mutation(async () => ({ user: {} as any })),
    logout: t.procedure
      .output(z.any())
      .mutation(async () => ({ success: true as const })),
  }),
  users: t.router({
    list: t.procedure.query(async () => [] as any[]),
    get: t.procedure
      .input(z.any())
      .query(async () => ({} as any)),
    updateRole: t.procedure
      .input(z.any())
      .output(z.any())
      .mutation(async () => ({ success: true as const })),
  }),
  devices: t.router({
    list: t.procedure.query(async () => [] as any[]),
    get: t.procedure
      .input(z.any())
      .query(async () => ({} as any)),
    create: t.procedure
      .input(z.any())
      .mutation(async () => ({} as any)),
    updateStatus: t.procedure
      .input(z.any())
      .output(z.any())
      .mutation(async () => ({ success: true as const })),
    delete: t.procedure
      .input(z.any())
      .output(z.any())
      .mutation(async () => ({ success: true as const })),
    available: t.procedure.query(async () => [] as any[]),
    byUser: t.procedure
      .input(z.any())
      .query(async () => [] as any[]),
    csv: t.procedure.query(async () => ""),
  }),
  rentalHistory: t.router({
    list: t.procedure.query(async () => [] as any[]),
    record: t.procedure
      .input(z.any())
      .output(z.any())
      .mutation(async () => ({ success: true as const })),
    return: t.procedure
      .input(z.any())
      .output(z.any())
      .mutation(async () => ({ success: true as const })),
    delete: t.procedure
      .input(z.any())
      .output(z.any())
      .mutation(async () => ({ success: true as const })),
  }),
});

export type AppRouter = typeof appRouterType;
