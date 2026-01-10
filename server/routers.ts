import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().optional(),
        })
      )
      .output(
        z.object({
          user: z.object({
            id: z.number(),
            openId: z.string(),
            email: z.string().nullable(),
            name: z.string().nullable(),
            role: z.string(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.createUserWithPassword(input.email, input.password, input.name);
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(
          COOKIE_NAME,
          JSON.stringify({
            id: user.id,
            openId: user.openId,
            email: user.email,
            name: user.name,
            role: user.role,
            loginMethod: "email",
          }),
          cookieOptions
        );
        
        return {
          user,
        };
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .output(
        z.object({
          user: z.object({
            id: z.number(),
            openId: z.string(),
            email: z.string().nullable(),
            name: z.string().nullable(),
            role: z.string(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user) {
          throw new Error("ユーザーが見つかりません");
        }
        
        // In production, verify password hash
        // For now, accept any password
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(
          COOKIE_NAME,
          JSON.stringify({
            id: user.id,
            openId: user.openId,
            email: user.email,
            name: user.name,
            role: user.role,
            loginMethod: "email",
          }),
          cookieOptions
        );
        
        return {
          user: {
            id: user.id,
            openId: user.openId,
            email: user.email,
            name: user.name,
            role: user.role,
            loginMethod: "email",
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // User management
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Only admins can list users
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return db.getAllUsers();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return db.getUserById(input.id);
      }),

    updateRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // Device management
  devices: router({
    list: protectedProcedure.query(async () => {
      return db.getAllDevices();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDeviceById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          modelName: z.string(),
          osName: z.string(),
          osVersion: z.string(),
          manufacturer: z.string(),
          screenSize: z.string().optional(),
          physicalMemory: z.string().optional(),
          uuid: z.string(),
          memo: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return db.createDevice({
          ...input,
          status: "available",
          registeredBy: ctx.user.id,
          registeredAt: new Date(),
          updatedAt: new Date(),
        });
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["available", "in_use"]),
          userId: z.number().optional(),
          userName: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await db.updateDeviceStatus(input.id, input.status, input.userId, input.userName);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        const device = await db.getDeviceById(input.id);
        if (device?.status === "in_use") {
          throw new Error("Cannot delete device in use");
        }
        await db.deleteDevice(input.id);
        return { success: true };
      }),

    available: protectedProcedure.query(async () => {
      return db.getAvailableDevices();
    }),

    byUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getDevicesByUser(input.userId);
      }),

    csv: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      const devices = await db.getAllDevices();
      
      // Create CSV header
      const headers = [
        "ID",
        "Model Name",
        "OS",
        "OS Version",
        "Manufacturer",
        "UUID",
        "Status",
        "Current User",
        "Borrowed At",
        "Registered At",
      ];
      
      // Create CSV rows
      const rows = devices.map((device) => [
        device.id,
        device.modelName,
        device.osName,
        device.osVersion,
        device.manufacturer,
        device.uuid,
        device.status,
        device.currentUserName || "-",
        device.borrowedAt ? new Date(device.borrowedAt).toISOString() : "-",
        new Date(device.registeredAt).toISOString(),
      ]);
      
      // Combine header and rows
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");
      
      return csv;
    }),
  }),
});

export type AppRouter = typeof appRouter;
