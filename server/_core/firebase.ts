import admin from "firebase-admin";
import { ENV } from "./env";

let firebaseApp: admin.app.App | null = null;
let firebaseDb: admin.database.Database | null = null;
let firestore: admin.firestore.Firestore | null = null;
let initializationPromise: Promise<admin.app.App> | null = null;
let initializationError: Error | null = null;

/**
 * Firebase Admin SDKを初期化（タイムアウト付き）
 */
export function initializeFirebase(): Promise<admin.app.App> {
  // 既に初期化済みの場合
  if (firebaseApp) {
    return Promise.resolve(firebaseApp);
  }

  // 初期化中の場合は、その Promise を返す
  if (initializationPromise) {
    return initializationPromise;
  }

  // 初期化エラーがある場合は、エラーを返す
  if (initializationError) {
    return Promise.reject(initializationError);
  }

  // 初期化処理を実行
  initializationPromise = (async () => {
    try {
      // Log environment variables for debugging
      console.log("[Firebase] Initializing with config:");
      console.log("[Firebase] Project ID:", ENV.firebaseProjectId ? "SET" : "NOT SET");
      console.log("[Firebase] Client Email:", ENV.firebaseClientEmail ? "SET" : "NOT SET");
      console.log("[Firebase] Private Key:", ENV.firebasePrivateKey ? "SET (" + ENV.firebasePrivateKey.length + " chars)" : "NOT SET");
      console.log("[Firebase] Database URL:", ENV.firebaseDatabaseUrl ? "SET" : "NOT SET");
      
      // Firebase秘密鍵をパース
      let privateKey = ENV.firebasePrivateKey;
      
      if (typeof privateKey === "string") {
        // Step 1: 最初に\\nをエスケープ解除
        privateKey = privateKey.replace(/\\n/g, "\n");
        console.log("[Firebase] Private key after unescape (first 50 chars):", privateKey.substring(0, 50));
        
        // Step 2: JSON文字列の場合、パース後に秘密鍵を取得
        if (privateKey.startsWith("{")) {
          try {
            const parsed = JSON.parse(privateKey);
            privateKey = parsed.private_key || privateKey;
            console.log("[Firebase] Extracted private_key from JSON");
          } catch (e) {
            console.log("[Firebase] Failed to parse as JSON, using as-is");
          }
        }
        
        // Step 3: PEM形式の修正 - -----BEGIN PRIVATE KEY----- の形式に統一
        if (!privateKey.includes("BEGIN PRIVATE KEY")) {
          console.log("[Firebase] Private key format is not standard PEM, attempting to fix...");
          // スペースなしの形式を修正
          privateKey = privateKey.replace(/-----BEGIN[A-Z\s]+KEY-----/, "-----BEGIN PRIVATE KEY-----");
          privateKey = privateKey.replace(/-----END[A-Z\s]+KEY-----/, "-----END PRIVATE KEY-----");
          console.log("[Firebase] Fixed PEM format (first 50 chars):", privateKey.substring(0, 50));
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
      firestore = admin.firestore(firebaseApp);
      console.log("[Firebase] Initialized successfully");
      return firebaseApp;
    } catch (error) {
      console.error("[Firebase] Initialization error:", error);
      initializationError = error as Error;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Firestore インスタンスを取得
 */
export async function getFirestore(): Promise<admin.firestore.Firestore> {
  await initializeFirebase();
  if (!firestore) {
    throw new Error("Firestore not initialized");
  }
  return firestore;
}

/**
 * Firebaseデータベースインスタンスを取得
 */
export async function getFirebaseDb(): Promise<admin.database.Database> {
  await initializeFirebase();
  if (!firebaseDb) {
    throw new Error("Firebase database not initialized");
  }
  return firebaseDb;
}

/**
 * Firestore からデバイス情報を取得
 */
export async function getDevicesFromFirestore() {
  try {
    const db = await getFirestore();
    
    console.log("[Firestore] Fetching devices from Firestore...");
    const devicesSnapshot = await db.collection("devices").get();

    if (devicesSnapshot.empty) {
      console.log("[Firestore] No devices data in Firestore");
      return [];
    }

    const devices: any[] = [];
    
    devicesSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Helper function to convert Firestore Timestamp to Date
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        if (typeof timestamp === 'number') {
          return new Date(timestamp);
        }
        return new Date();
      };
      
      devices.push({
        id: doc.id, // Use Firestore document ID directly
        modelName: data.modelName || "",
        osName: data.osName || "",
        osVersion: data.osVersion || "",
        manufacturer: data.manufacturer || "",
        screenSize: data.screenSize || "",
        physicalMemory: data.physicalMemory || "",
        uuid: data.uuid || "",
        status: data.status || "available",
        currentUserId: data.currentUserId || null,
        currentUserName: data.currentUserName || null,
        borrowedAt: data.borrowedAt ? convertTimestamp(data.borrowedAt) : null,
        memo: data.memo || "",
        registeredBy: data.registeredBy || "",
        registeredAt: convertTimestamp(data.registeredAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });

    // Sort devices by registeredAt (oldest first)
    devices.sort((a, b) => a.registeredAt.getTime() - b.registeredAt.getTime());

    console.log("[Firestore] Retrieved devices from Firestore:", devices.length, "devices");
    return devices;
  } catch (error) {
    console.error("[Firestore] Error getting devices:", error);
    throw error;
  }
}

/**
 * Firestore からユーザー情報を取得
 */
export async function getUsersFromFirestore() {
  try {
    const db = await getFirestore();
    
    console.log("[Firestore] Fetching users from Firestore...");
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      console.log("[Firestore] No users data in Firestore");
      return [];
    }

    const users: any[] = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Helper function to convert Firestore Timestamp to Date
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        if (typeof timestamp === 'number') {
          return new Date(timestamp);
        }
        return new Date();
      };
      
      users.push({
        id: doc.id, // Use Firestore document ID directly
        name: data.name || "",
        email: data.email || "",
        role: data.role || "user",
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });

    // Sort users by createdAt (oldest first)
    users.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    console.log("[Firestore] Retrieved users from Firestore:", users.length, "users");
    return users;
  } catch (error) {
    console.error("[Firestore] Error getting users:", error);
    throw error;
  }
}

/**
 * Firebaseからデバイス情報を取得（タイムアウト付き）
 */
export async function getDevicesFromFirebase() {
  try {
    const db = await getFirebaseDb();
    
    // タイムアウト付きで Firebase からデータを取得
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firebase devices query timeout")), 5000)
    );
    
    const dataPromise = db.ref("devices").get();
    const snapshot = await Promise.race([dataPromise, timeoutPromise]) as admin.database.DataSnapshot;

    if (!snapshot.exists()) {
      console.log("[Firebase] No devices data in Firebase");
      return [];
    }

    const devicesData = snapshot.val();
    console.log("[Firebase] Retrieved devices from Firebase:", Object.keys(devicesData).length, "devices");
    const devices: any[] = [];

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
 * Firebaseからユーザー情報を取得（タイムアウト付き）
 */
export async function getUsersFromFirebase() {
  try {
    const db = await getFirebaseDb();
    
    // タイムアウト付きで Firebase からデータを取得
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firebase users query timeout")), 5000)
    );
    
    const dataPromise = db.ref("users").get();
    const snapshot = await Promise.race([dataPromise, timeoutPromise]) as admin.database.DataSnapshot;

    if (!snapshot.exists()) {
      console.log("[Firebase] No users data in Firebase");
      return [];
    }

    const usersData = snapshot.val();
    console.log("[Firebase] Retrieved users from Firebase:", Object.keys(usersData).length, "users");
    const users: any[] = [];

    for (const [key, value] of Object.entries(usersData)) {
      const user = value as any;
      users.push({
        id: parseInt(key, 10) || 0,
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

/**
 * Firestore にデバイス情報を保存
 */
export async function saveDeviceToFirestore(deviceId: string, deviceData: any) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Saving device ${deviceId}...`);
    
    await db.collection("devices").doc(deviceId).set({
      ...deviceData,
      updatedAt: admin.firestore.Timestamp.now(),
    }, { merge: true });
    
    console.log(`[Firestore] Saved device ${deviceId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error saving device:", error);
    throw error;
  }
}

/**
 * Firestore でデバイスのステータスを更新
 */
export async function updateDeviceStatusInFirestore(
  deviceId: string,
  status: string,
  userId?: string | null,
  userName?: string | null
) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Updating device ${deviceId} status to ${status}...`);
    
    const updateData: any = {
      status,
      updatedAt: admin.firestore.Timestamp.now(),
    };
    
    if (status === "in_use") {
      updateData.currentUserId = userId || null;
      updateData.currentUserName = userName || null;
      updateData.borrowedAt = admin.firestore.Timestamp.now();
    } else if (status === "available") {
      updateData.currentUserId = null;
      updateData.currentUserName = null;
      updateData.borrowedAt = null;
    }
    
    await db.collection("devices").doc(deviceId).update(updateData);
    
    console.log(`[Firestore] Updated device ${deviceId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error updating device status:", error);
    throw error;
  }
}

/**
 * Firestore からレンタル履歴を取得
 */
export async function getRentalHistoryFromFirestore() {
  try {
    const db = await getFirestore();
    
    console.log("[Firestore] Fetching rental history...");
    const historySnapshot = await db.collection("rentalHistory").get();

    if (historySnapshot.empty) {
      console.log("[Firestore] No rental history data");
      return [];
    }

    const history: any[] = [];
    historySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        userId: data.userId,
        userName: data.userName,
        status: data.status,
        borrowedAt: data.borrowedAt?.toDate?.() || new Date(data.borrowedAt),
        returnedAt: data.returnedAt?.toDate?.() || (data.returnedAt ? new Date(data.returnedAt) : null),
      });
    });

    console.log("[Firestore] Retrieved rental history:", history.length, "records");
    return history;
  } catch (error) {
    console.error("[Firestore] Error getting rental history:", error);
    throw error;
  }
}

/**
 * Firestore にレンタル履歴を記録
 */
export async function recordRentalHistory(
  deviceId: number,
  deviceName: string,
  userId: string,
  userName: string,
  borrowedAt: Date
) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Recording rental history for device ${deviceId}...`);
    
    await db.collection("rentalHistory").add({
      deviceId,
      deviceName,
      userId,
      userName,
      status: "borrowed",
      borrowedAt: admin.firestore.Timestamp.fromDate(borrowedAt),
      returnedAt: null,
    });
    
    console.log(`[Firestore] Recorded rental history`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error recording rental history:", error);
    throw error;
  }
}

/**
 * Firestore のレンタル履歴を更新（返却）
 */
export async function recordRentalReturn(rentalId: string, returnedAt: Date) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Recording rental return for ${rentalId}...`);
    
    await db.collection("rentalHistory").doc(rentalId).update({
      status: "returned",
      returnedAt: admin.firestore.Timestamp.fromDate(returnedAt),
    });
    
    console.log(`[Firestore] Recorded rental return`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error recording rental return:", error);
    throw error;
  }
}

/**
 * Firestore から古いレンタル履歴を削除
 */
export async function deleteRentalHistoryFromFirestore(rentalId: string) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Deleting rental history ${rentalId}...`);
    
    await db.collection("rentalHistory").doc(rentalId).delete();
    
    console.log(`[Firestore] Deleted rental history`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error deleting rental history:", error);
    // Don't throw - this is a cleanup operation
  }
}

/**
 * Firestore からデバイスを削除
 */
export async function deleteDeviceFromFirestore(deviceId: string) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Deleting device ${deviceId}...`);
    
    // Use the device ID directly as the Firestore document ID
    await db.collection("devices").doc(deviceId).delete();
    
    console.log(`[Firestore] Deleted device ${deviceId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error deleting device:", error);
    throw error;
  }
}
