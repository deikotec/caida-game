import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "./firebase";
import { UserProfile } from "../types";

export const createUserProfile = async (user: User): Promise<UserProfile> => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const newUserProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            coins: 1000,
            gamesPlayed: 0,
            gamesWon: 0,
            currentRoomId: null,
            createdAt: Timestamp.now(),
        };
        await setDoc(userRef, newUserProfile);
        return newUserProfile;
    } else {
        return userSnap.data() as UserProfile;
    }
};