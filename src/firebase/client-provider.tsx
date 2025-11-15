
'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, queryClient, getSdks } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Define a type for the Firebase services object
type FirebaseServices = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
};

// Build the config object directly from environment variables at the top level of the client component
// This is a more robust way to ensure they are read correctly on the client side.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Use state to hold the initialized services. Start with null.
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    // This is the correct place to initialize Firebase.
    const services = initializeFirebase(firebaseConfig);
    setFirebaseServices(services);
    
    // The empty dependency array [] ensures this effect runs only once.
  }, []); 

  // While services are being initialized, we can show a loader or nothing.
  // Returning null or a loading component prevents children from rendering prematurely.
  if (!firebaseServices) {
    return null; // Or a global loading spinner
  }

  // Once initialized, render the provider with the services.
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
      queryClient={queryClient}
    >
      {children}
    </FirebaseProvider>
  );
}
