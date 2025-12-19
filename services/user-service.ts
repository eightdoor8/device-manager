import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, UserRole } from "@/types/device";

const USERS_COLLECTION = "users";

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
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
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
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
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    const now = Timestamp.now();

    if (userSnap.exists()) {
      // Update existing user
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
      await setDoc(userRef, {
        email,
        name: name || email.split("@")[0],
        role: UserRole.USER,
        createdAt: now,
        updatedAt: now,
      });
    }

    const updatedUser = await getUser(userId);
    if (!updatedUser) {
      throw new Error("Failed to create/update user");
    }
    return updatedUser;
  } catch (error) {
    console.error("Error creating/updating user:", error);
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
    console.error("Error checking admin status:", error);
    return false;
  }
}
