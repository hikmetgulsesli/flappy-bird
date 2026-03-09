/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sky
        'sky-cyan': 'var(--color-sky-cyan)',
        'sky-gradient': 'var(--color-sky-gradient)',
        'sky-light': 'var(--color-sky-light)',

        // Bird
        'bird-yellow': 'var(--color-bird-yellow)',
        'bird-dark': 'var(--color-bird-dark)',
        'bird-eye': 'var(--color-bird-eye)',
        'bird-pupil': 'var(--color-bird-pupil)',
        'bird-beak': 'var(--color-bird-beak)',

        // Pipes
        'pipe-green': 'var(--color-pipe-green)',
        'pipe-green-dark': 'var(--color-pipe-green-dark)',
        'pipe-light': 'var(--color-pipe-light)',
        'pipe-dark': 'var(--color-pipe-dark)',
        'pipe-border': 'var(--color-pipe-border)',

        // Ground
        'sand-ground': 'var(--color-sand-ground)',
        'sand-dark': 'var(--color-sand-dark)',
        'ground-border': 'var(--color-ground-border)',

        // UI
        'retro-gold': 'var(--color-gold)',
      },
      fontFamily: {
        'retro': ['var(--font-mono)'],
      },
      imageRendering: {
        'pixelated': 'pixelated',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.image-pixelated': {
          'image-rendering': 'pixelated',
        },
        '.crisp-edges': {
          'image-rendering': 'crisp-edges',
        },
      })
    },
  ],
}
