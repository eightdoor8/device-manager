import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RentalHistoryRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  osName: string;
  osVersion: string;
  physicalMemory: string;
  userId: string;
  userName: string;
  action: "borrow" | "return";
  timestamp: Timestamp;
  createdAt: Timestamp;
}

/**
 * Get rental history records from Firestore
 * @param maxRecords Maximum number of records to fetch (default: 100)
 * @returns Array of rental history records sorted by timestamp (newest first)
 */
export async function getRentalHistory(maxRecords: number = 100): Promise<RentalHistoryRecord[]> {
  try {
    console.log("[RentalHistoryService] Fetching rental history...");
    
    const rentalHistoryRef = collection(db, "rentalHistory");
    const q = query(
      rentalHistoryRef,
      orderBy("timestamp", "desc"),
      limit(maxRecords)
    );

    const snapshot = await getDocs(q);
    const records: RentalHistoryRecord[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      records.push({
        id: doc.id,
        deviceId: data.deviceId || "",
        deviceName: data.deviceName || "",
        manufacturer: data.manufacturer || "",
        osName: data.osName || "",
        osVersion: data.osVersion || "",
        physicalMemory: data.physicalMemory || "",
        userId: data.userId || "",
        userName: data.userName || "",
        action: data.action || "borrow",
        timestamp: data.timestamp || Timestamp.now(),
        createdAt: data.createdAt || Timestamp.now(),
      });
    });

    console.log(`[RentalHistoryService] Fetched ${records.length} rental history records`);
    return records;
  } catch (error) {
    console.error("[RentalHistoryService] Error fetching rental history:", error);
    throw error;
  }
}

/**
 * Format timestamp to readable date string
 * @param timestamp Firestore Timestamp
 * @returns Formatted date string (e.g., "2026-01-28 12:34")
 */
export function formatTimestamp(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Get action label in Japanese
 * @param action Action type ("borrow" or "return")
 * @returns Japanese label
 */
export function getActionLabel(action: string): string {
  return action === "return" ? "返却" : "貸出";
}
