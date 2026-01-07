import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Devices table
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  modelName: varchar("modelName", { length: 255 }).notNull(),
  osName: varchar("osName", { length: 100 }).notNull(),
  osVersion: varchar("osVersion", { length: 100 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 100 }).notNull(),
  screenSize: varchar("screenSize", { length: 100 }),
  physicalMemory: varchar("physicalMemory", { length: 100 }),
  uuid: varchar("uuid", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["available", "in_use"]).default("available").notNull(),
  currentUserId: int("currentUserId"),
  currentUserName: varchar("currentUserName", { length: 255 }),
  borrowedAt: timestamp("borrowedAt"),
  memo: text("memo"),
  registeredBy: int("registeredBy").notNull(),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;
