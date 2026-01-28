import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEVICE_ID_COUNTER_COLLECTION = "deviceIdCounters";

/**
 * Generate next device ID based on OS type
 * Android: A00001, A00002, ...
 * iOS: I00001, I00002, ...
 * @param osName OS name ("Android" or "iOS")
 * @returns Generated device ID (e.g., "A00001")
 */
export async function generateDeviceId(osName: string): Promise<string> {
  try {
    console.log("[DeviceIdService] Generating device ID for OS:", osName);

    // Determine prefix based on OS
    const prefix = osName === "iOS" ? "I" : "A";
    const counterId = `${prefix}_counter`;

    // Get current counter value
    const counterRef = doc(db, DEVICE_ID_COUNTER_COLLECTION, counterId);
    const counterSnap = await getDocs(
      query(
        collection(db, DEVICE_ID_COUNTER_COLLECTION),
        where("__name__", "==", counterId)
      )
    );

    let nextNumber = 1;

    if (counterSnap.docs.length > 0) {
      const counterData = counterSnap.docs[0].data();
      nextNumber = (counterData.value || 0) + 1;
    }

    // Update counter
    await setDoc(
      counterRef,
      {
        value: nextNumber,
        osName,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    // Format device ID with leading zeros (5 digits)
    const deviceId = `${prefix}${String(nextNumber).padStart(5, "0")}`;
    console.log("[DeviceIdService] Generated device ID:", deviceId);

    return deviceId;
  } catch (error) {
    console.error("[DeviceIdService] Error generating device ID:", error);
    throw error;
  }
}

/**
 * Get the next device ID without incrementing the counter (for preview)
 * @param osName OS name ("Android" or "iOS")
 * @returns Next device ID (e.g., "A00001")
 */
export async function getNextDeviceId(osName: string): Promise<string> {
  try {
    console.log("[DeviceIdService] Getting next device ID for OS:", osName);

    const prefix = osName === "iOS" ? "I" : "A";
    const counterId = `${prefix}_counter`;

    const counterSnap = await getDocs(
      query(
        collection(db, DEVICE_ID_COUNTER_COLLECTION),
        where("__name__", "==", counterId)
      )
    );

    let nextNumber = 1;

    if (counterSnap.docs.length > 0) {
      const counterData = counterSnap.docs[0].data();
      nextNumber = (counterData.value || 0) + 1;
    }

    const deviceId = `${prefix}${String(nextNumber).padStart(5, "0")}`;
    console.log("[DeviceIdService] Next device ID:", deviceId);

    return deviceId;
  } catch (error) {
    console.error("[DeviceIdService] Error getting next device ID:", error);
    throw error;
  }
}
