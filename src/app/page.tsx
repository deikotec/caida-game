"use client";

import { useUserStore } from "@/stores/useUserStore";
import AuthForm from "@/components/auth/AuthForm"; // Actualizado
import UserProfile from "@/components/auth/UserProfile";
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useUserStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-transparent border-teal-400 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      {user ? (
        <div className="text-center">
          <UserProfile />
          <Link href="/lobby">
            <button className="mt-8 px-8 py-4 bg-teal-500 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-teal-600 transition-all duration-300 transform hover:scale-105">
              Ir al Lobby
            </button>
          </Link>
        </div>
      ) : (
        <AuthForm /> // Actualizado
      )}
    </main>
  );
}
