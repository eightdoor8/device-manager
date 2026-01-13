import admin from "firebase-admin";
import { ENV } from "./env";

let firebaseApp: admin.app.App | null = null;
let firebaseDb: admin.database.Database | null = null;

/**
 * Firebase Admin SDKを初期化
 */
export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Log environment variables for debugging
    console.log("[Firebase] Initializing with config:");
    console.log("[Firebase] Project ID:", ENV.firebaseProjectId ? "SET" : "NOT SET");
    console.log("[Firebase] Client Email:", ENV.firebaseClientEmail ? "SET" : "NOT SET");
    console.log("[Firebase] Private Key:", ENV.firebasePrivateKey ? "SET (" + ENV.firebasePrivateKey.length + " chars)" : "NOT SET");
    console.log("[Firebase] Database URL:", ENV.firebaseDatabaseUrl ? "SET" : "NOT SET");
    
    // Firebase秘密鍵をパース
    let privateKey = ENV.firebasePrivateKey;
    
    // 秘密鍵が既にエスケープされている場合と、そうでない場合の両方に対応
    if (typeof privateKey === "string") {
      // 最初に\\nをエスケープ解除
      privateKey = privateKey.replace(/\\n/g, "\n");
      console.log("[Firebase] Private key after unescape (first 100 chars):", privateKey.substring(0, 100));
      
      // JSON文字列の場合、パース後に秘密鍵を取得
      if (privateKey.startsWith("{")) {
        // JSON形式の場合
        try {
          const parsed = JSON.parse(privateKey);
          privateKey = parsed.private_key || privateKey;
          console.log("[Firebase] Extracted private_key from JSON");
        } catch (e) {
          console.log("[Firebase] Failed to parse as JSON, using as-is", e);
          // JSONパースに失敗した場合はそのまま使用
        }
      }
    }
    
    console.log("[Firebase] Final private key (first 100 chars):", privateKey.substring(0, 100));

    const serviceAccount = {
      projectId: ENV.firebaseProjectId,
      privateKey: privateKey,
      clientEmail: ENV.firebaseClientEmail,
    };

    console.log("[Firebase] Service account configured, attempting initialization...");

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: ENV.firebaseDatabaseUrl,
    });

    firebaseDb = admin.database(firebaseApp);
    console.log("[Firebase] Initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("[Firebase] Initialization error:", error);
    throw error;
  }
}

/**
 * Firebaseデータベースインスタンスを取得
 */
export function getFirebaseDb(): admin.database.Database {
  if (!firebaseDb) {
    initializeFirebase();
  }
  if (!firebaseDb) {
    throw new Error("Firebase database not initialized");
  }
  return firebaseDb;
}

/**
 * Firebaseからデバイス情報を取得
 */
export async function getDevicesFromFirebase() {
  try {
    const db = getFirebaseDb();
    const snapshot = await db.ref("devices").get();

    if (!snapshot.exists()) {
      return [];
    }

    const devicesData = snapshot.val();
    const devices = [];

    for (const [key, value] of Object.entries(devicesData)) {
      const device = value as any;
      devices.push({
        id: parseInt(key, 10) || 0,
        modelName: device.modelName || "",
        osName: device.osName || "",
        osVersion: device.osVersion || "",
        manufacturer: device.manufacturer || "",
        screenSize: device.screenSize || "",
        physicalMemory: device.physicalMemory || "",
        uuid: device.uuid || "",
        status: device.status || "available",
        currentUserId: device.currentUserId || null,
        currentUserName: device.currentUserName || null,
        borrowedAt: device.borrowedAt ? new Date(device.borrowedAt) : null,
        memo: device.memo || "",
        registeredBy: device.registeredBy || "",
        registeredAt: device.registeredAt ? new Date(device.registeredAt) : new Date(),
        updatedAt: device.updatedAt ? new Date(device.updatedAt) : new Date(),
      });
    }

    return devices;
  } catch (error) {
    console.error("[Firebase] Error getting devices:", error);
    throw error;
  }
}

/**
 * Firebaseからユーザー情報を取得
 */
export async function getUsersFromFirebase() {
  try {
    const db = getFirebaseDb();
    const snapshot = await db.ref("users").get();

    if (!snapshot.exists()) {
      return [];
    }

    const usersData = snapshot.val();
    const users = [];

    for (const [key, value] of Object.entries(usersData)) {
      const user = value as any;
      users.push({
        id: key,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      });
    }

    return users;
  } catch (error) {
    console.error("[Firebase] Error getting users:", error);
    throw error;
  }
}
