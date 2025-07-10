"use client";

import Image from 'next/image';
import { UserProfile } from '@/types';

interface PlayerSeatProps {
    player: Partial<UserProfile> & { uid: string };
    isCurrentTurn: boolean;
    isOpponent?: boolean;
}

export default function PlayerSeat({ player, isCurrentTurn, isOpponent = false }: PlayerSeatProps) {
    const positionClass = isOpponent ? 'flex-col' : 'flex-col-reverse';
    const highlightClass = isCurrentTurn ? 'border-[#FFB22D] shadow-lg shadow-yellow-500/30' : 'border-transparent';

    return (
        <div className={`flex items-center gap-2 ${positionClass}`}>
            <div className={`relative h-16 w-16 rounded-full bg-gradient-to-br from-[#FFF08E] to-[#FFB22D] border-2 border-white/50 flex items-center justify-center font-bold text-2xl text-[#280C0B] shadow-lg`}>
                <Image src={player.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${player.displayName}`} alt="Avatar" layout="fill" className="rounded-full" />
            </div>
            <div className={`bg-[#280C0B]/80 backdrop-blur-sm border border-[#FFB22D]/30 text-white font-bold text-sm px-4 py-1.5 rounded-md transition-all ${highlightClass}`}>
                {player.displayName}
            </div>
        </div>
    );
}