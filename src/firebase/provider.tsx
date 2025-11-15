
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Auth, User, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { ethers } from 'ethers';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  queryClient: QueryClient;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean; // Tracks auth state loading
  isNewUser: boolean | null; // null: unknown, true: new, false: existing
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  // User authentication state
  user: User | null;
  isUserLoading: boolean;
  isNewUser: boolean | null;
  userError: Error | null;
  // Auth functions
  signInWithWallet: () => Promise<void>;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User | null;
  isUserLoading: boolean;
  isNewUser: boolean | null;
  userError: Error | null;
  signInWithWallet: () => Promise<void>;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  isNewUser: boolean | null;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

const checkUserProfileExists = async (firestore: Firestore, user: User): Promise<boolean> => {
    // For wallet users, UID is the address. Check if profile exists.
    const uid = user.providerData.some(p => p.providerId === 'custom') ? user.uid : user.uid;
    const userRef = doc(firestore, "users", uid);
    try {
        const docSnap = await getDoc(userRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking user profile:", error);
        return false; // Assume profile exists to avoid blocking the user on error
    }
};

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
  queryClient,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    isNewUser: null,
    userError: null,
  });

  const signInWithWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install it to continue.');
    }
    if (!auth) {
        throw new Error('Firebase Auth not initialized.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // 1. Get nonce from server
    const nonceRes = await fetch('/api/auth/wallet/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!nonceRes.ok) throw new Error('Failed to get nonce from server.');
    const { message } = await nonceRes.json();
    
    // 2. Sign message
    const signature = await signer.signMessage(message);

    // 3. Verify signature and get custom token
    const verifyRes = await fetch('/api/auth/wallet/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature }),
    });
    if (!verifyRes.ok) throw new Error('Signature verification failed.');
    const { token } = await verifyRes.json();
    
    // 4. Sign in with custom token
    await signInWithCustomToken(auth, token);
    
    // 5. Clean up nonce
    await fetch('/api/auth/wallet/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
    });
  }, [auth]);


  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, isNewUser: null, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState(prev => ({ ...prev, isUserLoading: true }));

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in, check if their profile document exists.
          const profileExists = await checkUserProfileExists(firestore, firebaseUser);
          setUserAuthState({ 
            user: firebaseUser, 
            isUserLoading: false, 
            isNewUser: !profileExists, 
            userError: null 
          });
        } else {
          // User is signed out.
          setUserAuthState({ user: null, isUserLoading: false, isNewUser: null, userError: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, isNewUser: null, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      isNewUser: userAuthState.isNewUser,
      userError: userAuthState.userError,
      signInWithWallet
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState, signInWithWallet]);

  return (
    <QueryClientProvider client={queryClient}>
        <FirebaseContext.Provider value={contextValue}>
          <FirebaseErrorListener />
          {children}
        </FirebaseContext.Provider>
    </QueryClientProvider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    isNewUser: context.isNewUser,
    userError: context.userError,
    signInWithWallet: context.signInWithWallet
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
}

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, isNewUser, userError } = useFirebase();
  return { user, isUserLoading, isNewUser, userError };
};

export { useQuery };
