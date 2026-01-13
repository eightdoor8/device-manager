import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env") });

// Initialize Firebase Admin SDK
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase credentials in environment variables");
  console.error("Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

// Parse private key
if (typeof privateKey === "string") {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  } as admin.ServiceAccount),
});

const db = admin.firestore();

async function updateUserRoles() {
  const emails = ["yokoyama@eightdoor.co.jp", "info@eightdoor.co.jp"];

  for (const email of emails) {
    try {
      // Query users collection by email
      const usersSnapshot = await db.collection("users").where("email", "==", email).get();

      if (usersSnapshot.empty) {
        console.log(`User not found: ${email}`);
        continue;
      }

      // Update the first matching user
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({ role: "admin" });
      console.log(`✓ Updated ${email} to admin role (ID: ${userDoc.id})`);
    } catch (error) {
      console.error(`✗ Failed to update ${email}:`, error);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

updateUserRoles().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
