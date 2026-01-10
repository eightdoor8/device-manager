import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import type { InsertUser } from "../drizzle/schema";
import { users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import bcrypt from "bcrypt";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Device queries
 */
import type { InsertDevice } from "../drizzle/schema";
import { devices } from "../drizzle/schema";

export async function getAllDevices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices);
}

export async function getDeviceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(devices).where(eq(devices.id, id));
  return result[0] || null;
}

export async function getDeviceByUuid(uuid: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(devices).where(eq(devices.uuid, uuid));
  return result[0] || null;
}

export async function createDevice(data: InsertDevice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(devices).values(data);
  const created = await getDeviceByUuid(data.uuid);
  return created?.id || 0;
}

export async function updateDevice(id: number, data: Partial<InsertDevice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(devices).set(data).where(eq(devices.id, id));
}

export async function updateDeviceStatus(
  id: number,
  status: "available" | "in_use",
  userId?: number,
  userName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (status === "in_use") {
    updateData.currentUserId = userId;
    updateData.currentUserName = userName;
    updateData.borrowedAt = new Date();
  } else {
    updateData.currentUserId = null;
    updateData.currentUserName = null;
    updateData.borrowedAt = null;
  }
  
  await db.update(devices).set(updateData).where(eq(devices.id, id));
}

export async function deleteDevice(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(devices).where(eq(devices.id, id));
}

export async function getAvailableDevices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices).where(eq(devices.status, "available"));
}

export async function getDevicesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices).where(eq(devices.currentUserId, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

const BCRYPT_ROUNDS = 10;

export async function createUserWithPassword(
  email: string,
  password: string,
  name?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    throw new Error("このメールアドレスは既に登録されています");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Generate a unique openId for email-based users
  const openId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create user
  await db.insert(users).values({
    openId,
    email,
    name: name || email.split("@")[0],
    loginMethod: "email",
    role: "user",
  });

  // Retrieve the created user
  const createdUser = await db.select().from(users).where(eq(users.email, email));
  if (createdUser.length === 0) {
    throw new Error("Failed to create user");
  }

  const user = createdUser[0];
  return {
    id: user.id,
    openId: user.openId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function verifyPassword(email: string, password: string) {
  // This is a placeholder - in production, you need to store password hashes
  // For now, we'll accept any password for testing
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }
  // In production, verify the password hash here
  // For now, accept any password
  return user;
}

export async function verifyPasswordHash(hashedPassword: string, password: string) {
  return await bcrypt.compare(password, hashedPassword);
}
