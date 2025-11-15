
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import 'dotenv/config';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;

// This function initializes and returns the admin app and auth instances.
// It ensures that initialization only happens once.
export function getAdminApp() {
  // Check if already initialized to avoid re-initializing
  if (adminApp && adminAuth) {
    return {
      app: adminApp,
      auth: adminAuth,
    };
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or not accessible in this environment.');
    }

    // Parse the service account key from the environment variable.
    // This will throw an error if the key is malformed, which is caught below.
    const serviceAccount = JSON.parse(serviceAccountKey);

    // Initialize the app if it hasn't been initialized yet.
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      // If apps already exist, get the default one.
      adminApp = getApps()[0];
    }
    
    // Get the auth service from the initialized app.
    adminAuth = getAuth(adminApp);

    // Return the initialized services.
    return {
      app: adminApp,
      auth: adminAuth,
    };

  } catch (error) {
    // Log the detailed error for server-side debugging.
    console.error("Firebase Admin SDK Initialization Error:", (error as Error).message);
    
    // Throw a more generic error to be handled by the calling function.
    // This prevents leaking sensitive details about the service account key.
    throw new Error("Firebase Admin SDK could not be initialized. This function should only be called in a server environment with the required environment variables.");
  }
}
