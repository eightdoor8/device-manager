import * as Device from "expo-device";
import { Platform } from "react-native";
import iosModels from "@/data/ios-models.json";
import androidModels from "@/data/android-models.json";

export interface DeviceInfo {
  osName: string;
  osVersion: string;
  internalModelId: string;
  modelName: string;
  manufacturer: string;
  uuid: string;
  physicalMemory?: string;
}

/**
 * Map iOS internal model ID to human-readable name
 */
function mapIOSModel(internalId: string): string {
  const mapped = iosModels[internalId as keyof typeof iosModels];
  if (mapped) {
    return mapped;
  }
  // If not found, return a formatted unknown device string
  return `Unknown Device (${internalId})`;
}

/**
 * Map Android internal model ID to human-readable name
 */
function mapAndroidModel(internalId: string): string {
  // Try exact match first
  const exactMatch = androidModels[internalId as keyof typeof androidModels];
  if (exactMatch) {
    return exactMatch;
  }

  // Try partial match (e.g., "SM-S928U" matches "SM-S928")
  const partialKey = Object.keys(androidModels).find((key) => internalId.startsWith(key));
  if (partialKey) {
    return androidModels[partialKey as keyof typeof androidModels];
  }

  // If not found, return the model name or a formatted unknown device string
  return Device.modelName || `Unknown Device (${internalId})`;
}

/**
 * Get current device information
 */
export async function getCurrentDeviceInfo(): Promise<DeviceInfo> {
  const osName = Platform.OS === "ios" ? "iOS" : "Android";
  const osVersion = Device.osVersion || "Unknown";
  const internalModelId = Device.modelId || "Unknown";
  const manufacturer = Device.manufacturer || "Unknown";

  // Get UUID (device ID)
  // Note: On iOS, this is a unique identifier for the app installation
  // On Android, this is the Android ID
  const uuid = Device.osBuildId || "Unknown";

  // Map internal model ID to human-readable name
  let modelName: string;
  if (Platform.OS === "ios") {
    modelName = mapIOSModel(internalModelId);
  } else {
    modelName = mapAndroidModel(internalModelId);
  }

  // Get physical memory (RAM)
  // Note: This is not directly available in expo-device
  // We'll leave it as optional for manual input
  const physicalMemory = Device.totalMemory
    ? `${Math.round(Device.totalMemory / (1024 * 1024 * 1024))}GB`
    : undefined;

  return {
    osName,
    osVersion,
    internalModelId,
    modelName,
    manufacturer,
    uuid,
    physicalMemory,
  };
}

/**
 * Get device type (Phone, Tablet, Desktop, etc.)
 */
export function getDeviceType(): string {
  if (Device.deviceType === Device.DeviceType.PHONE) {
    return "Phone";
  } else if (Device.deviceType === Device.DeviceType.TABLET) {
    return "Tablet";
  } else if (Device.deviceType === Device.DeviceType.DESKTOP) {
    return "Desktop";
  } else if (Device.deviceType === Device.DeviceType.TV) {
    return "TV";
  }
  return "Unknown";
}

/**
 * Check if the device is a physical device (not simulator/emulator)
 */
export function isPhysicalDevice(): boolean {
  return Device.isDevice;
}
