
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';
import { QueryClient } from '@tanstack/react-query'
import { firebaseConfig as importedConfig } from './config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(config: typeof importedConfig) {
  if (!config.apiKey) {
    throw new Error("Missing Firebase API Key. Please check your .env.local file and ensure it is passed correctly to the FirebaseClientProvider.");
  }
  const app = !getApps().length ? initializeApp(config) : getApp();
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export const queryClient = new QueryClient();

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
