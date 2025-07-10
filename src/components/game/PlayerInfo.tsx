"use client";

import Image from 'next/image';
import { UserProfile } from '@/types';

interface PlayerInfoProps {
    player: Partial<UserProfile> & { uid: string, coins?: number };
    isOpponent?: boolean;
}

export default function PlayerInfo({ player, isOpponent = false }: PlayerInfoProps) {
    const positionClass = isOpponent
        ? 'top-4 right-4 items-end'
        : 'bottom-4 left-4 items-start';

    return (
        <div className={`absolute ${positionClass} flex flex-col gap-2`}>
            <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-[#FFF08E] to-[#FFB22D] border-2 border-white/50 shadow-lg">
                    <Image
                        src={player.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${player.displayName}`}
                        alt="Avatar"
                        layout="fill"
                        className="rounded-full object-cover"
                    />
                </div>
                <div className="flex flex-col">
                    <div className="bg-[#280C0B]/80 backdrop-blur-sm border border-[#FFB22D]/30 text-white font-bold text-sm px-4 py-1.5 rounded-md">
                        {player.displayName}
                    </div>
                    <div className="bg-[#280C0B]/80 backdrop-blur-sm border border-[#FFB22D]/30 text-[#FFB22D] font-bold text-sm px-4 py-1.5 rounded-md mt-1">
                        $ {(player.coins || 0).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}