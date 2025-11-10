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
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const isLoading = isUserLoading || isProfileLoading;
    
    return { role: userProfile?.role, isLoading };
}
