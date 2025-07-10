"use client";

import { Card as CardType } from '@/types';
import Image from 'next/image';
import { Swords } from 'lucide-react';

const cardUrlMap: { [key: string]: string } = {
    '1O': 'https://i.postimg.cc/g09Yhkvr/1o.webp', '2O': 'https://i.postimg.cc/4y3ZGKT2/2o.webp', '3O': 'https://i.postimg.cc/rF3c6FZg/3o.webp', '4O': 'https://i.postimg.cc/FRrXbf1F/4o.webp', '5O': 'https://i.postimg.cc/HWP15kmH/5o.webp', '6O': 'https://i.postimg.cc/wBzCHtX5/6o.webp', '7O': 'https://i.postimg.cc/0jz3Z7vv/7o.webp', 'SO': 'https://i.postimg.cc/MTgkC9dH/so.webp', 'CO': 'https://i.postimg.cc/c1VZ2Lbh/co.webp', 'RO': 'https://i.postimg.cc/k5XdK62J/ro.webp',
    '1C': 'https://i.postimg.cc/Z5vb0yv1/1c.webp', '2C': 'https://i.postimg.cc/rpSqNXJj/2c.webp', '3C': 'https://i.postimg.cc/66Ht0hdk/3c.webp', '4C': 'https://i.postimg.cc/tgHjTvjx/4c.webp', '5C': 'https://i.postimg.cc/5yjcGZwZ/5c.webp', '6C': 'https://i.postimg.cc/WbBRWYtH/6c.webp', '7C': 'https://i.postimg.cc/MTKgMhrv/7c.webp', 'SC': 'https://i.postimg.cc/vB4F2J7C/sc.webp', 'CC': 'https://i.postimg.cc/DfWnxXBm/cc.webp', 'RC': 'https://i.postimg.cc/qvrrBZ0C/rc.webp',
    '1E': 'https://i.postimg.cc/3JRJ5q8r/1e.webp', '2E': 'https://i.postimg.cc/sXmybYbZ/2e.webp', '3E': 'https://i.postimg.cc/Y0y7Cprr/3e.webp', '4E': 'https://i.postimg.cc/xdySbGfF/4e.webp', '5E': 'https://i.postimg.cc/qqYfdjwg/5e.webp', '6E': 'https://i.postimg.cc/Vknx39CL/6e.webp', '7E': 'https://i.postimg.cc/SsT3WDwV/7e.webp', 'SE': 'https://i.postimg.cc/1ttY5DfF/10e.webp', 'CE': 'https://i.postimg.cc/vTxq5M7H/11e.webp', 'RE': 'https://i.postimg.cc/BnC0jcQ7/re.webp',
    '1B': 'https://i.postimg.cc/xT4j0P8v/1b.webp', '2B': 'https://i.postimg.cc/63ttHjbX/2b.webp', '3B': 'https://i.postimg.cc/ncCZwQ2C/3b.webp', '4B': 'https://i.postimg.cc/JzX8RV98/4b.webp', '5B': 'https://i.postimg.cc/sXTdTVZY/5b.webp', '6B': 'https://i.postimg.cc/YqGKxB2F/6b.webp', '7B': 'https://i.postimg.cc/g0Kf0YsC/7b.webp', 'SB': 'https://i.postimg.cc/mrXWwL9Q/sb.webp', 'CB': 'https://i.postimg.cc/jCV8X9v6/cb.webp', 'RB': 'https://i.postimg.cc/02Dxsqgs/rb.webp',
};

interface CardProps {
    card: CardType | null;
    isFaceDown?: boolean;
    isPlayable?: boolean;
    onClick?: (card: CardType) => void;
    className?: string;
}

export default function CardComponent({ card, isFaceDown = false, isPlayable = false, onClick, className = "" }: CardProps) {
    if (isFaceDown) {
        return (
            <div className={`h-32 w-24 bg-[#025300] rounded-lg border-2 border-green-800 shadow-lg flex items-center justify-center ${className}`}>
                <Swords className="text-yellow-400 opacity-50" size={40} />
            </div>
        );
    }

    if (!card) return null;

    const imageUrl = cardUrlMap[card.id.toUpperCase()];
    const hoverEffect = isPlayable ? 'transform hover:-translate-y-4 transition-transform duration-200 cursor-pointer' : '';

    return (
        <div
            onClick={() => isPlayable && onClick && onClick(card)}
            className={`relative h-32 w-24 bg-white rounded-lg shadow-xl overflow-hidden ${hoverEffect} ${className}`}
        >
            <Image
                src={imageUrl || 'https://placehold.co/160x224/000/fff?text=Error'}
                alt={`${card.rank} de ${card.suit}`}
                layout="fill"
                objectFit="cover"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/160x224/000/fff?text=Error'; }}
            />
        </div>
    );
}