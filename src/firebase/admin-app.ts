
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import 'dotenv/config';

let adminApp: App;
let adminAuth: Auth;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    adminApp = getApps()[0];
  }
  adminAuth = getAuth(adminApp);

} catch (error) {
  console.error("Firebase Admin Initialization Error:", (error as Error).message);
  // This will prevent the app from crashing during build if the key is missing.
  // The functions using getAdminApp will then handle the uninitialized state.
}

export function getAdminApp() {
  if (!adminApp || !adminAuth) {
    throw new Error("Firebase Admin SDK has not been initialized. Check your environment variables.");
  }
  return {
    app: adminApp,
    auth: adminAuth,
  };
}
