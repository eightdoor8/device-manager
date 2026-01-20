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
        id: 0, // Will be assigned sequentially after sorting
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
    
    // Assign sequential IDs based on registration order
    devices.forEach((device, index) => {
      device.id = index + 1;
    });

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
        id: 0, // Will be assigned sequentially after sorting
        name: data.name || "",
        email: data.email || "",
        role: data.role || "user",
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });

    // Sort users by createdAt (oldest first)
    users.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Assign sequential IDs based on creation order
    users.forEach((user, index) => {
      user.id = index + 1;
    });

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
 * Firestoreのユーザーロールを更新
 */
export async function updateUserRoleInFirestore(email: string, role: "user" | "admin") {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Updating role for ${email} to ${role}...`);
    
    // Query users collection by email
    const usersSnapshot = await db.collection("users").where("email", "==", email).get();
    
    if (usersSnapshot.empty) {
      throw new Error(`User not found: ${email}`);
    }
    
    // Update the first matching user
    const userDoc = usersSnapshot.docs[0];
    await userDoc.ref.update({ role });
    
    console.log(`[Firestore] Updated ${email} to ${role} role`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error updating user role:", error);
    throw error;
  }
}


/**
 * Firestore に貸出履歴を記録
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
    
    const rentalRecord = {
      deviceId,
      deviceName,
      userId,
      userName,
      borrowedAt: new Date(borrowedAt),
      returnedAt: null,
      status: "borrowed", // borrowed or returned
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add to rentalHistory collection
    const docRef = await db.collection("rentalHistory").add(rentalRecord);
    
    // 100件を超えた場合、古い履歴を削除
    await cleanupOldRentalHistory();
    
    console.log(`[Firestore] Rental history recorded with ID: ${docRef.id}`);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("[Firestore] Error recording rental history:", error);
    throw error;
  }
}

/**
 * Firestore の貸出履歴を返却状態に更新
 */
export async function recordRentalReturn(
  rentalHistoryId: string,
  returnedAt: Date
) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Recording return for rental history ${rentalHistoryId}...`);
    
    const docRef = db.collection("rentalHistory").doc(rentalHistoryId);
    await docRef.update({
      returnedAt: new Date(returnedAt),
      status: "returned",
      updatedAt: new Date(),
    });
    
    console.log(`[Firestore] Return recorded for rental history ${rentalHistoryId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error recording rental return:", error);
    throw error;
  }
}

/**
 * Firestore から貸出履歴を取得
 */
export async function getRentalHistoryFromFirestore() {
  try {
    const db = await getFirestore();
    
    console.log("[Firestore] Fetching rental history from Firestore...");
    const rentalHistorySnapshot = await db
      .collection("rentalHistory")
      .orderBy("createdAt", "desc")
      .get();

    if (rentalHistorySnapshot.empty) {
      console.log("[Firestore] No rental history data in Firestore");
      return [];
    }

    const rentalHistory: any[] = [];
    rentalHistorySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Helper function to convert Firestore Timestamp to Date
      const convertTimestamp = (timestamp: any): Date | null => {
        if (!timestamp) return null;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        if (typeof timestamp === 'number') {
          return new Date(timestamp);
        }
        return null;
      };
      
      rentalHistory.push({
        id: doc.id,
        deviceId: data.deviceId || 0,
        deviceName: data.deviceName || "",
        userId: data.userId || "",
        userName: data.userName || "",
        borrowedAt: convertTimestamp(data.borrowedAt),
        returnedAt: convertTimestamp(data.returnedAt),
        status: data.status || "borrowed",
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });

    console.log("[Firestore] Retrieved rental history from Firestore:", rentalHistory.length, "records");
    return rentalHistory;
  } catch (error) {
    console.error("[Firestore] Error getting rental history:", error);
    throw error;
  }
}

/**
 * Firestore から貸出履歴を削除
 */
export async function deleteRentalHistoryFromFirestore(rentalHistoryId: string) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Deleting rental history ${rentalHistoryId}...`);
    
    await db.collection("rentalHistory").doc(rentalHistoryId).delete();
    
    console.log(`[Firestore] Deleted rental history ${rentalHistoryId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error deleting rental history:", error);
    throw error;
  }
}

/**
 * 古い貸出履歴を削除（100件を上限）
 */
async function cleanupOldRentalHistory() {
  try {
    const db = await getFirestore();
    
    // 貸出履歴の総数を取得
    const countSnapshot = await db.collection("rentalHistory").count().get();
    const totalCount = countSnapshot.data().count;
    
    if (totalCount > 100) {
      console.log(`[Firestore] Rental history count (${totalCount}) exceeds limit (100). Cleaning up old records...`);
      
      // 古い履歴を削除（最も古いものから削除）
      const deleteCount = totalCount - 100;
      const oldRecordsSnapshot = await db
        .collection("rentalHistory")
        .orderBy("createdAt", "asc")
        .limit(deleteCount)
        .get();
      
      const batch = db.batch();
      oldRecordsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`[Firestore] Deleted ${deleteCount} old rental history records`);
    }
  } catch (error) {
    console.error("[Firestore] Error cleaning up old rental history:", error);
    // Don't throw - this is a cleanup operation
  }
}

/**
 * Firestore からデバイスを削除
 */
export async function deleteDeviceFromFirestore(deviceId: number) {
  try {
    const db = await getFirestore();
    
    console.log(`[Firestore] Deleting device ${deviceId}...`);
    
    // Firestore の devices コレクションからデバイスを削除
    await db.collection("devices").doc(String(deviceId)).delete();
    
    console.log(`[Firestore] Deleted device ${deviceId}`);
    return { success: true };
  } catch (error) {
    console.error("[Firestore] Error deleting device:", error);
    throw error;
  }
}
