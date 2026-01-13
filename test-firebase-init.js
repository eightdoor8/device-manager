const admin = require('firebase-admin');

// 環境変数から設定を取得
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const databaseUrl = process.env.FIREBASE_DATABASE_URL;

console.log('=== Firebase Configuration ===');
console.log('Project ID:', projectId);
console.log('Client Email:', clientEmail);
console.log('Database URL:', databaseUrl);
console.log('Private Key (first 50 chars):', privateKey?.substring(0, 50));
console.log('Private Key type:', typeof privateKey);
console.log('Private Key includes BEGIN:', privateKey?.includes('BEGIN'));
console.log('');

try {
  if (!projectId || !privateKey || !clientEmail || !databaseUrl) {
    throw new Error('Missing required environment variables');
  }

  const serviceAccount = {
    projectId,
    privateKey,
    clientEmail,
  };

  console.log('Service Account:', JSON.stringify(serviceAccount, null, 2));
  console.log('');

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseUrl,
  });

  console.log('✓ Firebase initialized successfully');
  
  // Test database connection
  const db = admin.database(app);
  db.ref('devices').once('value', (snapshot) => {
    console.log('✓ Database connection successful');
    console.log('Devices data:', snapshot.val());
    process.exit(0);
  }, (error) => {
    console.error('✗ Database connection error:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('✗ Firebase initialization error:', error.message);
  console.error(error);
  process.exit(1);
}
