"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Si ya hay sesión, redirige automáticamente al lobby
    useEffect(() => {
        if (!loading && user) {
            router.push("/lobby");
        }
    }, [user, loading, router]);

    // Función para iniciar sesión con Google
    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-blue-100 to-blue-300">
            <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-sm text-center">
                <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
                <p className="text-gray-600 mb-6">Accede con tu cuenta de Google</p>

                <button
                    onClick={loginWithGoogle}
                    className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 rounded-md py-2 hover:bg-gray-50 transition"
                >
                    <FcGoogle className="text-2xl" />
                    <span className="text-gray-700 font-medium">Continuar con Google</span>
                </button>
            </div>
        </main>
    );
}
