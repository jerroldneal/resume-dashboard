/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dockhand: {
          bg: 'var(--dockhand-bg)',
          surface: 'var(--dockhand-surface)',
          primary: 'var(--dockhand-primary)',
          text: 'var(--dockhand-text)',
          border: 'var(--dockhand-border)'
        }
      }
    }
  },
  plugins: []
}
