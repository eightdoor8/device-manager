import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, UserRole } from "@/types/device";

const USERS_COLLECTION = "users";

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    console.log("[UserService] Getting user:", userId);
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      console.log("[UserService] User found:", userSnap.id);
      const data = userSnap.data();
      return {
        id: userSnap.id,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    }
    console.log("[UserService] User not found:", userId);
    return null;
  } catch (error) {
    console.error("[UserService] Error getting user:", error);
    throw error;
  }
}

/**
 * Create or update user document
 */
export async function createOrUpdateUser(
  userId: string,
  email: string,
  name?: string,
): Promise<User> {
  try {
    console.log("[UserService] Creating/updating user:", userId, email);
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    const now = Timestamp.now();

    if (userSnap.exists()) {
      // Update existing user
      console.log("[UserService] Updating existing user");
      await setDoc(
        userRef,
        {
          email,
          name: name || userSnap.data().name,
          updatedAt: now,
        },
        { merge: true },
      );
    } else {
      // Create new user with default role
      console.log("[UserService] Creating new user with role:", UserRole.USER);
      await setDoc(userRef, {
        email,
        name: name || email.split("@")[0],
        role: UserRole.USER,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log("[UserService] Getting updated user document");
    const updatedUser = await getUser(userId);
    if (!updatedUser) {
      throw new Error("Failed to create/update user");
    }
    console.log("[UserService] User created/updated successfully");
    return updatedUser;
  } catch (error) {
    console.error("[UserService] Error creating/updating user:", error);
    throw error;
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await getUser(userId);
    return user?.role === UserRole.ADMIN;
  } catch (error) {
    console.error("[UserService] Error checking admin status:", error);
    return false;
  }
}
