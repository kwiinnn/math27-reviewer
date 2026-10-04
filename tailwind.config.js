/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ui)', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // Semantic colour tokens. Values live in src/index.css and change with
      // the theme and contrast settings, so components never name a raw colour.
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        inset: 'var(--inset)',
        line: 'var(--line)',
        strong: 'var(--strong)',
        ink: 'var(--ink)',
        ink2: 'var(--ink2)',
        ink3: 'var(--ink3)',
        primary: 'var(--primary)',
        onprimary: 'var(--onprimary)',
        basic: 'var(--basic)',
        exam: 'var(--exam)',
        overlay: 'var(--overlay)',
      },
    },
  },
  plugins: [],
};
