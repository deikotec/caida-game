"use client";

import { ReactNode, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useUserStore } from '@/stores/useUserStore';
import { createUserProfile } from '@/lib/firestore-actions';

interface AuthProviderProps {
    children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const { setUser, setLoading } = useUserStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                setLoading(true);
                // Pasamos el displayName del objeto user de Firebase Auth
                const userProfile = await createUserProfile(user, user.displayName || undefined);
                setUser(userProfile);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setLoading]);

    return <>{children}</>;
}