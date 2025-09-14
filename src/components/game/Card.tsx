import Image from 'next/image';
import { Card as CardType } from '@/types';
import { getCardImage } from '@/lib/game-logic';

interface CardProps {
    card: CardType;
    isFaceDown?: boolean;
    isPlayable?: boolean;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

// Este componente ahora es responsable únicamente de renderizar una carta.
// La lógica de si es jugable o no se controla desde la página principal.
export default function CardComponent({ card, isFaceDown = false, isPlayable = false, onClick, className = "", style }: CardProps) {

    // Renderiza el reverso de la carta si se especifica.
    if (isFaceDown) {
        return (
            <div
                className={`card-back bg-gradient-to-br from-primary-accent to-primary-accent-hover border-2 border-secondary-accent ${className}`}
                style={style}
            />
        );
    }

    const imageUrl = getCardImage(card.rank, card.suit);

    return (
        <div
            onClick={isPlayable ? onClick : undefined}
            className={`card ${isPlayable ? 'cursor-pointer' : 'cursor-default'} ${className}`}
            style={style}
        >
            <Image
                src={imageUrl}
                alt={`${card.displayRank} de ${card.suit}`}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
                unoptimized
            />
        </div>
    );
}
