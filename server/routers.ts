import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getDevicesFromFirestore, getUsersFromFirestore, getDevicesFromFirebase, getUsersFromFirebase, recordRentalHistory, recordRentalReturn, getRentalHistoryFromFirestore, deleteRentalHistoryFromFirestore, deleteDeviceFromFirestore } from "./_core/firebase";

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
      // Try to get users from Firestore first, then Firebase Realtime DB, then MySQL
      try {
        const firestoreUsers = await getUsersFromFirestore();
        if (firestoreUsers.length > 0) {
          console.log("[Routers] Returning users from Firestore");
          return firestoreUsers;
        }
      } catch (error) {
        console.warn("[Routers] Failed to get users from Firestore:", error);
      }
      try {
        const firebaseUsers = await getUsersFromFirebase();
        if (firebaseUsers.length > 0) {
          console.log("[Routers] Returning users from Firebase Realtime DB");
          return firebaseUsers;
        }
      } catch (error) {
        console.warn("[Routers] Failed to get users from Firebase Realtime DB:", error);
      }
      console.log("[Routers] Returning users from MySQL");
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
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]), email: z.string().optional() }))
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
      // Try to get devices from Firestore first, then Firebase Realtime DB, then MySQL
      try {
        const firestoreDevices = await getDevicesFromFirestore();
        if (firestoreDevices.length > 0) {
          console.log("[Routers] Returning devices from Firestore");
          return firestoreDevices;
        }
      } catch (error) {
        console.warn("[Routers] Failed to get devices from Firestore:", error);
      }
      try {
        const firebaseDevices = await getDevicesFromFirebase();
        if (firebaseDevices.length > 0) {
          console.log("[Routers] Returning devices from Firebase Realtime DB");
          return firebaseDevices;
        }
      } catch (error) {
        console.warn("[Routers] Failed to get devices from Firebase Realtime DB:", error);
      }
      console.log("[Routers] Returning devices from MySQL");
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
          deviceName: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        // Get current device status before update
        const currentDevice = await db.getDeviceById(input.id);
        if (!currentDevice) {
          throw new Error("Device not found");
        }
        
        // Update device status
        await db.updateDeviceStatus(input.id, input.status, input.userId, input.userName);
        
        // Auto-log rental history when status changes
        const deviceName = input.deviceName || currentDevice.modelName || `Device ${input.id}`;
        const userId = input.userId?.toString() || "unknown";
        const userName = input.userName || "Unknown User";
        
        if (input.status === "in_use" && currentDevice.status !== "in_use") {
          // Device is being borrowed - record checkout
          console.log(`[Auto-Log] Recording checkout for device ${input.id}`);
          await recordRentalHistory(
            input.id,
            deviceName,
            userId,
            userName,
            new Date()
          );
        } else if (input.status === "available" && currentDevice.status === "in_use") {
          // Device is being returned - record return
          console.log(`[Auto-Log] Recording return for device ${input.id}`);
          // Find the active rental record for this device
          const rentalHistory = await getRentalHistoryFromFirestore();
          const activeRental = rentalHistory.find(
            (r) => r.deviceId === input.id && r.status === "borrowed"
          );
          if (activeRental) {
            await recordRentalReturn(activeRental.id, new Date());
          }
        }
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        await deleteDeviceFromFirestore(input.id);
        return { success: true };
      }),

    available: protectedProcedure.query(async () => {
      // Try to get available devices from Firestore first, then Firebase Realtime DB, then MySQL
      try {
        const firestoreDevices = await getDevicesFromFirestore();
        if (firestoreDevices.length > 0) {
          return firestoreDevices.filter((d) => d.status === "available");
        }
      } catch (error) {
        console.warn("[Routers] Failed to get available devices from Firestore:", error);
      }
      try {
        const firebaseDevices = await getDevicesFromFirebase();
        if (firebaseDevices.length > 0) {
          return firebaseDevices.filter((d) => d.status === "available");
        }
      } catch (error) {
        console.warn("[Routers] Failed to get available devices from Firebase Realtime DB:", error);
      }
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
      // Try to get devices from Firestore first, then Firebase Realtime DB, then MySQL
      let devices: any[] = [];
      try {
        const firestoreDevices = await getDevicesFromFirestore();
        if (firestoreDevices.length > 0) {
          devices = firestoreDevices;
        } else {
          throw new Error("No devices in Firestore");
        }
      } catch (error) {
        console.warn("[Routers] Failed to get devices from Firestore:", error);
        try {
          const firebaseDevices = await getDevicesFromFirebase();
          if (firebaseDevices.length > 0) {
            devices = firebaseDevices;
          } else {
            throw new Error("No devices in Firebase Realtime DB");
          }
        } catch (fbError) {
          console.warn("[Routers] Failed to get devices from Firebase Realtime DB:", fbError);
          devices = await db.getAllDevices();
        }
      }
      
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
      const rows = devices.map((device: any) => [
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

  rentalHistory: router({
    list: protectedProcedure.query(async () => {
      return getRentalHistoryFromFirestore();
    }),

    record: protectedProcedure
      .input(
        z.object({
          deviceId: z.number(),
          deviceName: z.string(),
          userId: z.string(),
          userName: z.string(),
          borrowedAt: z.date(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return recordRentalHistory(
          input.deviceId,
          input.deviceName,
          input.userId,
          input.userName,
          input.borrowedAt
        );
      }),

    return: protectedProcedure
      .input(
        z.object({
          rentalHistoryId: z.string(),
          returnedAt: z.date(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return recordRentalReturn(input.rentalHistoryId, input.returnedAt);
      }),

    delete: protectedProcedure
      .input(z.object({ rentalHistoryId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        return deleteRentalHistoryFromFirestore(input.rentalHistoryId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
