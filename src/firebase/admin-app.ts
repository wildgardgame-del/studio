
import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';

let adminApp: App | undefined;

function getServiceAccount() {
  // Check for the single, JSON-formatted service account key first.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      // This is the recommended way, using the full JSON key.
      return JSON.parse(serviceAccountKey);
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY from JSON. Ensure it's a valid JSON string.", e);
      // Fall through to try individual keys.
    }
  }

  // Fallback for individual environment variables if the single key isn't present or fails to parse.
  // This is useful for local development or environments where multiline JSON is tricky.
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key from environment variables often has escaped newlines.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }

  // If neither method provides the necessary credentials, return null.
  return null;
}


// This function initializes and returns the admin app.
// It ensures that initialization only happens once.
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    // This error will be thrown if the environment variables are not set,
    // which is a critical failure for any admin-level operation.
    throw new Error('Firebase Admin SDK service account credentials are not set. Please set FIREBASE_SERVICE_ACCOUNT_KEY or the individual project, client email, and private key variables in your environment.');
  }
  
  if (getApps().length === 0) {
    // Initialize the app if it hasn't been initialized yet.
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // Or get the existing default app.
    adminApp = getApp();
  }

  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}
