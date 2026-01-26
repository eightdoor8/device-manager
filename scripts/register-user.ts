/**
 * Firebase Admin SDK を使用してユーザーを登録するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/register-user.ts <email> <displayName> <role>
 * 
 * 例:
 * npx tsx scripts/register-user.ts yokoyama@eightdoor.co.jp yokoyama admin
 */

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Firebase Admin SDK の初期化
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(process.cwd(), "firebase-service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Firebase service account file not found: ${serviceAccountPath}`);
  console.error("Please set FIREBASE_SERVICE_ACCOUNT_PATH or place firebase-service-account.json in the project root");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const auth = admin.auth();
const db = admin.firestore();

async function registerUser(email: string, displayName: string, role: "user" | "admin" = "user") {
  try {
    console.log(`\n📝 Registering user: ${email} (${displayName}) as ${role}...`);

    // Firebase Authentication にユーザーを作成
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`✓ User already exists in Firebase Auth with UID: ${user.uid}`);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // ユーザーが存在しない場合は作成
        user = await auth.createUser({
          email: email,
          displayName: displayName,
          password: Math.random().toString(36).slice(-12), // ランダムなパスワード
        });
        console.log(`✓ Created user in Firebase Auth with UID: ${user.uid}`);
      } else {
        throw error;
      }
    }

    // Firestore の users コレクションにユーザー情報を追加
    const userRef = db.collection("users").doc(email);
    const userData = {
      uid: user.uid,
      email: email,
      displayName: displayName,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userData, { merge: true });
    console.log(`✓ Added user to Firestore with role: ${role}`);

    // カスタムクレームを設定（オプション）
    await auth.setCustomUserClaims(user.uid, { role: role });
    console.log(`✓ Set custom claims with role: ${role}`);

    console.log(`\n✅ User registered successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   Role: ${role}`);
    console.log(`   UID: ${user.uid}`);

    return { uid: user.uid, email, displayName, role };
  } catch (error) {
    console.error(`\n❌ Error registering user:`, error);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

// スクリプト実行
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: npx tsx scripts/register-user.ts <email> <displayName> [role]");
  console.error("Example: npx tsx scripts/register-user.ts yokoyama@eightdoor.co.jp yokoyama admin");
  process.exit(1);
}

const [email, displayName, role = "user"] = args;
registerUser(email, displayName, role as "user" | "admin").catch(() => process.exit(1));
