"use client";

import CardComponent from './Card';

interface CollectedPileProps {
    count: number;
    isOpponent?: boolean;
}

export default function CollectedPile({ count, isOpponent = false }: CollectedPileProps) {
    if (count === 0) return null;

    const positionClass = isOpponent ? 'top-4 left-4' : 'bottom-4 right-4';

    return (
        <div className={`absolute ${positionClass}`}>
            <div className="relative">
                <CardComponent card={null} isFaceDown={true} />
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-[#FFF08E] to-[#FFB22D] text-[#280C0B] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                    {count}
                </div>
            </div>
        </div>
    );
}

