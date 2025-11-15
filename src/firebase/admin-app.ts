
import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';

let adminApp: App | undefined;

function getServiceAccount() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      return JSON.parse(serviceAccountKey);
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY from JSON", e);
    }
  }

  // Fallback for separate variables if the single key isn't present
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }

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
    throw new Error('Firebase Admin SDK service account credentials are not set. Please set FIREBASE_SERVICE_ACCOUNT_KEY or the individual project an client variables in your environment.');
  }
  
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
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
