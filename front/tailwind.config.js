/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/app/**/*.{js,jsx}', './src/components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        escolar: {
          navy: '#1E3A5F',
          blue: '#2E5984',
          sky: '#E8F4FC',
          yellow: '#F4B942',
          gold: '#E8A317',
          green: '#2D6A4F',
          mint: '#D8F3DC',
          coral: '#E76F51',
          cream: '#FFF8E7',
          chalk: '#F5F0E8',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(30, 58, 95, 0.08)',
        cardHover: '0 8px 30px rgba(30, 58, 95, 0.15)',
      },
    },
  },
  plugins: [],
};
