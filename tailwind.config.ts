import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales del proyecto
        primary: {
          DEFAULT: '#0A1128', // Azul Marino
          light: '#1a2a4a',
          dark: '#050812',
        },
        accent: {
          DEFAULT: '#D4AF37', // Dorado
          light: '#e8c547',
          dark: '#a68828',
        },
        // Colores neutros
        neutral: {
          light: '#F8F8F8',
          DEFAULT: '#FFFFFF',
          dark: '#333333',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],  // Títulos
        body: ['Open Sans', 'sans-serif'],    // Cuerpo
      },
    },
  },
  plugins: [],
}
export default config
