/** @type {import('tailwindcss').Config} */
export default {
    // Aquí le decimos a Tailwind que busque clases en todos los archivos JS, JSX, TS, TSX y HTML
    // dentro de la carpeta 'src'. Esto es crucial para que los estilos se apliquen.
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {}, // Podemos extender el tema de Tailwind aquí en el futuro si es necesario.
    },
    plugins: [],
}
