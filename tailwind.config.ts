import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            // Se añaden los colores del prototipo como variables de Tailwind
            // para mantener la consistencia del diseño.
            colors: {
                'dark-primary': '#111827',
                'dark-secondary': '#1F2937',
                'panel-bg': '#1a2035',
                'border-color': '#374151',
                'primary-accent': '#4338CA',
                'primary-accent-hover': '#3730A3',
                'secondary-accent': '#10B981',
                'text-light': '#E5E7EB',
                'text-muted': '#9CA3AF',
                'text-gold': '#FBBF24',
                'danger': '#DC2626',
                'danger-hover': '#B91C1C',
                'game-board-start': '#059669',
                'game-board-end': '#065F46',
            }
        },
    },
    plugins: [],
};
export default config;
