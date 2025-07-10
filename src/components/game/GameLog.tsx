"use client";

import { GameLog as GameLogType } from '@/types';
import { Star, ArrowRight } from 'lucide-react';

interface GameLogProps {
    logs: GameLogType[];
}

export default function GameLog({ logs }: GameLogProps) {
    const getIcon = (type: GameLogType['type']) => {
        switch (type) {
            case 'points': return <Star className="h-4 w-4 text-yellow-400 shrink-0" />;
            case 'system': return <ArrowRight className="h-4 w-4 text-sky-400 shrink-0" />;
            default: return <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />;
        }
    };

    return (
        <aside className="w-full lg:w-1/3 xl:w-1/4 bg-[#560301]/80 backdrop-blur-sm border border-[#FFB22D]/20 rounded-lg p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-[#FFB22D] border-b border-[#FFB22D]/20 pb-2">Registro de la Partida</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                {logs.map((event, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm p-2 bg-[#280C0B]/60 rounded-lg">
                        {getIcon(event.type)}
                        <p className="text-white">{event.message}</p>
                    </div>
                ))}
            </div>
        </aside>
    );
}