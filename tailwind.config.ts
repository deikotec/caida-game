import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require('tailwindcss-bg-patterns')({
            patterns: {
                // puedes definir más patrones aquí
            },
            variants: {
                // y aquí las variantes (e.g. 'hover')
            }
        }),
    ],
};
export default config;