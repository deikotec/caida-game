import { create } from 'zustand';
import { UserProfile } from '../types';

interface UserState {
    user: UserProfile | null;
    isLoading: boolean;
    setUser: (user: UserProfile | null) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
}));