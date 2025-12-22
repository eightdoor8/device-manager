import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Device, DeviceStatus, DeviceFilter, DeviceFormData } from "@/types/device";

const DEVICES_COLLECTION = "devices";

/**
 * Convert Firestore document to Device object
 */
function convertToDevice(id: string, data: DocumentData): Device {
  return {
    id,
    modelName: data.modelName,
    internalModelId: data.internalModelId,
    osName: data.osName,
    osVersion: data.osVersion,
    manufacturer: data.manufacturer,
    screenSize: data.screenSize,
    physicalMemory: data.physicalMemory,
    uuid: data.uuid,
    status: data.status,
    currentUserId: data.currentUserId,
    currentUserName: data.currentUserName,
    borrowedAt: data.borrowedAt?.toDate(),
    memo: data.memo,
    registeredBy: data.registeredBy,
    registeredAt: data.registeredAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  };
}

/**
 * Get all devices with optional filters
 */
export async function getDevices(filter?: DeviceFilter): Promise<Device[]> {
  try {
    console.log("[DeviceService] Getting devices with filter:", filter);
    const devicesRef = collection(db, DEVICES_COLLECTION);
    let q = query(devicesRef, orderBy("updatedAt", "desc"));

    // Apply filters
    if (filter?.status) {
      q = query(devicesRef, where("status", "==", filter.status), orderBy("updatedAt", "desc"));
    }
    if (filter?.osName) {
      q = query(devicesRef, where("osName", "==", filter.osName), orderBy("updatedAt", "desc"));
    }
    if (filter?.manufacturer) {
      q = query(
        devicesRef,
        where("manufacturer", "==", filter.manufacturer),
        orderBy("updatedAt", "desc"),
      );
    }

    const querySnapshot = await getDocs(q);
    console.log("[DeviceService] Found devices:", querySnapshot.docs.length);
    let devices = querySnapshot.docs.map((doc) => convertToDevice(doc.id, doc.data()));

    // Apply search query (client-side filtering)
    if (filter?.searchQuery) {
      const searchLower = filter.searchQuery.toLowerCase();
      devices = devices.filter(
        (device) =>
          device.modelName.toLowerCase().includes(searchLower) ||
          device.osVersion.toLowerCase().includes(searchLower) ||
          device.manufacturer.toLowerCase().includes(searchLower),
      );
    }

    return devices;
  } catch (error) {
    console.error("[DeviceService] Error getting devices:", error);
    throw error;
  }
}

/**
 * Get a single device by ID
 */
export async function getDevice(deviceId: string): Promise<Device | null> {
  try {
    console.log("[DeviceService] Getting device:", deviceId);
    const deviceRef = doc(db, DEVICES_COLLECTION, deviceId);
    const deviceSnap = await getDoc(deviceRef);

    if (deviceSnap.exists()) {
      console.log("[DeviceService] Device found");
      return convertToDevice(deviceSnap.id, deviceSnap.data());
    }
    console.log("[DeviceService] Device not found");
    return null;
  } catch (error) {
    console.error("[DeviceService] Error getting device:", error);
    throw error;
  }
}

/**
 * Register a new device
 */
export async function registerDevice(
  deviceData: DeviceFormData,
  userId: string,
): Promise<string> {
  try {
    console.log("[DeviceService] Registering device...");
    console.log("[DeviceService] Device data:", deviceData);
    console.log("[DeviceService] User ID:", userId);

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, DEVICES_COLLECTION), {
      ...deviceData,
      status: DeviceStatus.AVAILABLE,
      registeredBy: userId,
      registeredAt: now,
      updatedAt: now,
    });
    console.log("[DeviceService] Device registered successfully:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[DeviceService] Error registering device:", error);
    throw error;
  }
}

/**
 * Update device information
 */
export async function updateDevice(
  deviceId: string,
  updates: Partial<DeviceFormData>,
): Promise<void> {
  try {
    console.log("[DeviceService] Updating device:", deviceId);
    const deviceRef = doc(db, DEVICES_COLLECTION, deviceId);
    await updateDoc(deviceRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    console.log("[DeviceService] Device updated successfully");
  } catch (error) {
    console.error("[DeviceService] Error updating device:", error);
    throw error;
  }
}

/**
 * Borrow a device
 */
export async function borrowDevice(
  deviceId: string,
  userId: string,
  userName: string,
): Promise<void> {
  try {
    console.log("[DeviceService] Borrowing device:", deviceId);
    const device = await getDevice(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }
    if (device.status === DeviceStatus.IN_USE) {
      throw new Error("Device is already in use");
    }

    const deviceRef = doc(db, DEVICES_COLLECTION, deviceId);
    await updateDoc(deviceRef, {
      status: DeviceStatus.IN_USE,
      currentUserId: userId,
      currentUserName: userName,
      borrowedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log("[DeviceService] Device borrowed successfully");
  } catch (error) {
    console.error("[DeviceService] Error borrowing device:", error);
    throw error;
  }
}

/**
 * Return a device
 */
export async function returnDevice(deviceId: string, userId: string): Promise<void> {
  try {
    console.log("[DeviceService] Returning device:", deviceId);
    const device = await getDevice(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }
    if (device.status !== DeviceStatus.IN_USE) {
      throw new Error("Device is not in use");
    }
    if (device.currentUserId !== userId) {
      throw new Error("You are not the current user of this device");
    }

    const deviceRef = doc(db, DEVICES_COLLECTION, deviceId);
    await updateDoc(deviceRef, {
      status: DeviceStatus.AVAILABLE,
      currentUserId: null,
      currentUserName: null,
      borrowedAt: null,
      updatedAt: Timestamp.now(),
    });
    console.log("[DeviceService] Device returned successfully");
  } catch (error) {
    console.error("[DeviceService] Error returning device:", error);
    throw error;
  }
}

/**
 * Check if a device with the same UUID already exists
 */
export async function checkDeviceDuplicate(uuid: string): Promise<boolean> {
  try {
    console.log("[DeviceService] Checking for duplicate device with UUID:", uuid);
    const devicesRef = collection(db, DEVICES_COLLECTION);
    const q = query(devicesRef, where("uuid", "==", uuid));

    const querySnapshot = await getDocs(q);
    const exists = querySnapshot.docs.length > 0;
    console.log("[DeviceService] Duplicate check result:", exists);
    return exists;
  } catch (error) {
    console.error("[DeviceService] Error checking for duplicate device:", error);
    throw error;
  }
}

/**
 * Delete a device
 */
export async function deleteDevice(deviceId: string): Promise<void> {
  try {
    console.log("[DeviceService] Deleting device:", deviceId);
    const deviceRef = doc(db, DEVICES_COLLECTION, deviceId);
    await deleteDoc(deviceRef);
    console.log("[DeviceService] Device deleted successfully");
  } catch (error) {
    console.error("[DeviceService] Error deleting device:", error);
    throw error;
  }
}

/**
 * Get devices borrowed by a specific user
 */
export async function getDevicesByUser(userId: string): Promise<Device[]> {
  try {
    console.log("[DeviceService] Getting devices for user:", userId);
    const devicesRef = collection(db, DEVICES_COLLECTION);
    const q = query(
      devicesRef,
      where("currentUserId", "==", userId),
      orderBy("borrowedAt", "desc"),
    );

    const querySnapshot = await getDocs(q);
    console.log("[DeviceService] Found devices for user:", querySnapshot.docs.length);
    return querySnapshot.docs.map((doc) => convertToDevice(doc.id, doc.data()));
  } catch (error) {
    console.error("[DeviceService] Error getting user devices:", error);
    throw error;
  }
}
