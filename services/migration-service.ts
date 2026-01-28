import {
  collection,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  DocumentData,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEVICES_COLLECTION = "devices";
const DEVICE_ID_COUNTER_COLLECTION = "deviceIdCounters";

/**
 * Migrate existing devices to add deviceId field
 * This function should be run once to migrate all existing devices
 */
export async function migrateDevicesToDeviceId(): Promise<{
  total: number;
  migrated: number;
  skipped: number;
}> {
  try {
    console.log("[MigrationService] Starting device migration...");

    const devicesRef = collection(db, DEVICES_COLLECTION);
    const snapshot = await getDocs(devicesRef);

    let migrated = 0;
    let skipped = 0;
    const total = snapshot.docs.length;

    // Initialize counters
    const androidCounterRef = doc(db, DEVICE_ID_COUNTER_COLLECTION, "A_counter");
    const iosCounterRef = doc(db, DEVICE_ID_COUNTER_COLLECTION, "I_counter");

    let androidCounter = 0;
    let iosCounter = 0;

    console.log(`[MigrationService] Found ${total} devices to migrate`);

    // Process each device
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as DocumentData;

      // Skip if already has deviceId
      if (data.deviceId) {
        console.log(`[MigrationService] Skipping device ${docSnapshot.id} - already has deviceId`);
        skipped++;
        continue;
      }

      try {
        // Determine OS and generate device ID
        const osName = data.osName || "Android";
        const prefix = osName === "iOS" ? "I" : "A";

        if (prefix === "A") {
          androidCounter++;
        } else {
          iosCounter++;
        }

        const deviceId = `${prefix}${String(
          prefix === "A" ? androidCounter : iosCounter
        ).padStart(5, "0")}`;

        // Update device with new deviceId
        await updateDoc(doc(db, DEVICES_COLLECTION, docSnapshot.id), {
          deviceId,
          updatedAt: Timestamp.now(),
        });

        console.log(
          `[MigrationService] Migrated device ${docSnapshot.id} with deviceId: ${deviceId}`
        );
        migrated++;
      } catch (error) {
        console.error(`[MigrationService] Error migrating device ${docSnapshot.id}:`, error);
      }
    }

    // Update counters
    try {
      await updateDoc(androidCounterRef, {
        value: androidCounter,
        osName: "Android",
        updatedAt: Timestamp.now(),
      });

      await updateDoc(iosCounterRef, {
        value: iosCounter,
        osName: "iOS",
        updatedAt: Timestamp.now(),
      });

      console.log(
        `[MigrationService] Updated counters - Android: ${androidCounter}, iOS: ${iosCounter}`
      );
    } catch (error) {
      console.error("[MigrationService] Error updating counters:", error);
    }

    console.log(
      `[MigrationService] Migration completed - Total: ${total}, Migrated: ${migrated}, Skipped: ${skipped}`
    );

    return {
      total,
      migrated,
      skipped,
    };
  } catch (error) {
    console.error("[MigrationService] Error during migration:", error);
    throw error;
  }
}

/**
 * Check migration status
 */
export async function checkMigrationStatus(): Promise<{
  totalDevices: number;
  devicesWithDeviceId: number;
  devicesWithoutDeviceId: number;
  migrationPercentage: number;
}> {
  try {
    console.log("[MigrationService] Checking migration status...");

    const devicesRef = collection(db, DEVICES_COLLECTION);
    const snapshot = await getDocs(devicesRef);

    const totalDevices = snapshot.docs.length;
    let devicesWithDeviceId = 0;
    let devicesWithoutDeviceId = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as DocumentData;
      if (data.deviceId) {
        devicesWithDeviceId++;
      } else {
        devicesWithoutDeviceId++;
      }
    });

    const migrationPercentage =
      totalDevices > 0 ? Math.round((devicesWithDeviceId / totalDevices) * 100) : 0;

    console.log(
      `[MigrationService] Migration status - Total: ${totalDevices}, With deviceId: ${devicesWithDeviceId}, Without: ${devicesWithoutDeviceId}, Percentage: ${migrationPercentage}%`
    );

    return {
      totalDevices,
      devicesWithDeviceId,
      devicesWithoutDeviceId,
      migrationPercentage,
    };
  } catch (error) {
    console.error("[MigrationService] Error checking migration status:", error);
    throw error;
  }
}
