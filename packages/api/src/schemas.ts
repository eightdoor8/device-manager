import { z } from "zod";

/**
 * Auth Schemas
 */
export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userOutputSchema = z.object({
  id: z.number(),
  openId: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  role: z.string(),
});

export const authRegisterOutputSchema = z.object({
  user: userOutputSchema,
});

export const authLoginOutputSchema = z.object({
  user: userOutputSchema.extend({
    loginMethod: z.string(),
  }),
});

export const authLogoutOutputSchema = z.object({
  success: z.literal(true),
});

/**
 * User Management Schemas
 */
export const getUserInputSchema = z.object({
  id: z.number(),
});

export const updateUserRoleInputSchema = z.object({
  userId: z.number(),
  role: z.enum(["user", "admin"]),
  email: z.string().optional(),
});

export const updateUserRoleOutputSchema = z.object({
  success: z.literal(true),
});

/**
 * Device Schemas
 */
export const createDeviceInputSchema = z.object({
  modelName: z.string(),
  osName: z.string(),
  osVersion: z.string(),
  manufacturer: z.string(),
  screenSize: z.string().optional(),
  physicalMemory: z.string().optional(),
  uuid: z.string(),
  memo: z.string().optional(),
});

export const deviceStatusSchema = z.enum(["available", "in_use"]);

export const updateDeviceStatusInputSchema = z.object({
  id: z.number(),
  status: deviceStatusSchema,
  userId: z.number().optional(),
  userName: z.string().optional(),
  deviceName: z.string().optional(),
});

export const updateDeviceStatusOutputSchema = z.object({
  success: z.literal(true),
});

export const deleteDeviceInputSchema = z.object({
  id: z.string(),
});

export const deleteDeviceOutputSchema = z.object({
  success: z.literal(true),
});

export const getDeviceInputSchema = z.object({
  id: z.number(),
});

export const getDevicesByUserInputSchema = z.object({
  userId: z.number(),
});

/**
 * Rental History Schemas
 */
export const recordRentalInputSchema = z.object({
  deviceId: z.number(),
  deviceName: z.string(),
  userId: z.string(),
  userName: z.string(),
  borrowedAt: z.date(),
});

export const recordRentalOutputSchema = z.object({
  success: z.literal(true),
});

export const returnRentalInputSchema = z.object({
  rentalHistoryId: z.string(),
  returnedAt: z.date(),
});

export const returnRentalOutputSchema = z.object({
  success: z.literal(true),
});

export const deleteRentalHistoryInputSchema = z.object({
  rentalHistoryId: z.string(),
});

export const deleteRentalHistoryOutputSchema = z.object({
  success: z.literal(true),
});

/**
 * Type Exports (for convenience)
 */
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type User = z.infer<typeof userOutputSchema>;
export type AuthRegisterOutput = z.infer<typeof authRegisterOutputSchema>;
export type AuthLoginOutput = z.infer<typeof authLoginOutputSchema>;

export type CreateDeviceInput = z.infer<typeof createDeviceInputSchema>;
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;
export type UpdateDeviceStatusInput = z.infer<typeof updateDeviceStatusInputSchema>;

export type RecordRentalInput = z.infer<typeof recordRentalInputSchema>;
export type ReturnRentalInput = z.infer<typeof returnRentalInputSchema>;
