import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Definimos el tipo de dato para el contexto
interface AuthContextProps {
    user: User | null;
    loading: boolean;
}

// Creamos el contexto con valores por defecto
const AuthContext = createContext<AuthContextProps>({
    user: null,
    loading: true,
});

// Hook para acceder al contexto desde cualquier parte de la app
export const useAuth = () => useContext(AuthContext);

// Componente proveedor del contexto que escucha cambios de sesión
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Escucha los cambios de sesión de Firebase Auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);

            // Si el usuario inició sesión y es nuevo, lo guardamos en Firestore
            if (firebaseUser) {
                const userRef = doc(db, "users", firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName || "Sin nombre",
                        email: firebaseUser.email,
                        photoURL: firebaseUser.photoURL,
                        coins: 1000, // Monedas iniciales
                        gamesPlayed: 0,
                        gamesWon: 0,
                        currentRoomId: "",
                        createdAt: serverTimestamp(),
                    });
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // Proveemos el contexto a los hijos
    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
