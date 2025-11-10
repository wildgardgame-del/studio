'use client';

import { useFirebase, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';

type UserProfile = {
    role: 'user' | 'dev' | 'admin';
};

export function useRole() {
    const { user, firestore, isUserLoading } = useFirebase();

    // Memoize the document reference. It will be null until user and firestore are available.
    // This query should NOT be run for the hardcoded admin, as their role is determined locally.
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore || user.email === 'ronneeh@gmail.com') {
            return null;
        }
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    // Subscribe to the document. This will be inactive if userDocRef is null.
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    // Hardcoded override for the admin user. This check is fast and doesn't need Firestore.
    if (user && user.email === 'ronneeh@gmail.com') {
        return { role: 'admin' as const, isLoading: false };
    }

    // Determine the overall loading state.
    // We are loading if the initial user object is loading, OR if we have a doc ref but the profile isn't loaded yet.
    const isLoading = isUserLoading || (!!userDocRef && isProfileLoading);
    
    // When loading is complete, and we have a user profile, return their role.
    // If loading is finished and there's no profile, they are a 'user' by default (or something is wrong).
    // While loading, the role is undefined.
    const finalRole = isLoading ? undefined : userProfile?.role;

    return { role: finalRole, isLoading };
}
