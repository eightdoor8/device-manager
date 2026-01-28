/**
 * Device status enum
 */
export enum DeviceStatus {
  AVAILABLE = "available",
  IN_USE = "in_use",
}

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

/**
 * Device document in Firestore
 */
export interface Device {
  id: string;
  // 基本情報
  modelName: string; // 例: "iPhone 14 Pro Max"
  internalModelId: string; // 例: "iPhone15,3"
  osName: string; // 例: "iOS"
  osVersion: string; // 例: "17.2"
  manufacturer: string; // 例: "Apple"
  
  // ハードウェア情報
  screenSize?: string; // 例: "6.7インチ"
  physicalMemory?: string; // 例: "6GB"
  uuid?: string; // 端末固有ID（廃止予定）
  deviceId: string; // 採番ユニークID（例: "A00001", "I00001")
  
  // ステータス情報
  status: DeviceStatus;
  currentUserId?: string; // 貸出中のユーザーID
  currentUserName?: string; // 貸出中のユーザー名
  borrowedAt?: Date; // 貸出開始日時
  
  // メタデータ
  memo?: string; // メモ
  registeredBy: string; // 登録者のユーザーID
  registeredAt: Date; // 登録日時
  updatedAt: Date; // 更新日時
}

/**
 * User document in Firestore
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Device filter options
 */
export interface DeviceFilter {
  osName?: string;
  manufacturer?: string;
  status?: DeviceStatus;
  searchQuery?: string;
}

/**
 * Device form data (for registration)
 */
export interface DeviceFormData {
  modelName: string;
  internalModelId: string;
  osName: string;
  osVersion: string;
  manufacturer: string;
  screenSize?: string;
  physicalMemory?: string;
  uuid?: string; // 廃止予定
  deviceId?: string; // 自動採番される（登録時は不要）
  memo?: string;
}
