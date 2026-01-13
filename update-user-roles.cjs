const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

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

// Parse private key - follow the same logic as firebase.ts
if (typeof privateKey === "string") {
  // Step 1: Unescape \\n
  privateKey = privateKey.replace(/\\n/g, "\n");
  console.log("[Setup] Private key after unescape (first 50 chars):", privateKey.substring(0, 50));
  
  // Step 2: If it's a JSON string, parse it
  if (privateKey.startsWith("{")) {
    try {
      const parsed = JSON.parse(privateKey);
      privateKey = parsed.private_key || privateKey;
      console.log("[Setup] Extracted private_key from JSON");
    } catch (e) {
      console.log("[Setup] Failed to parse as JSON, using as-is");
    }
  }
  
  // Step 3: Fix PEM format
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    console.log("[Setup] Private key format is not standard PEM, attempting to fix...");
    privateKey = privateKey.replace(/-----BEGIN[A-Z\s]+KEY-----/, "-----BEGIN PRIVATE KEY-----");
    privateKey = privateKey.replace(/-----END[A-Z\s]+KEY-----/, "-----END PRIVATE KEY-----");
    console.log("[Setup] Fixed PEM format (first 50 chars):", privateKey.substring(0, 50));
  }
}

console.log("Initializing Firebase Admin SDK...");
console.log("Project ID:", projectId);
console.log("Client Email:", clientEmail);
console.log("Private Key (first 100 chars):", privateKey.substring(0, 100));

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
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
