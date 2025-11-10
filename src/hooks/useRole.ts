'use client';

import { useFirebase, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';

type UserProfile = {
    role: 'user' | 'dev' | 'admin';
};

export function useRole() {
    const { user, firestore, isUserLoading } = useFirebase();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        // Don't fetch the profile for the hardcoded admin, as we'll override it anyway.
        if (user.email === 'ronneeh@gmail.com') return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    // Specific override for the admin user. This check is now primary.
    if (user && user.email === 'ronneeh@gmail.com') {
        return { role: 'admin' as const, isLoading: false };
    }

    // For any other user, determine the loading state and role from Firestore.
    const isLoading = isUserLoading || isProfileLoading;
    
    // Return the role from the profile, but only when loading is complete.
    // While loading, the role is undefined, which is the correct state.
    return { role: isLoading ? undefined : userProfile?.role, isLoading };
}
