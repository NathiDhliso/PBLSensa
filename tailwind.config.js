/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        'deep-amethyst': 'rgb(var(--color-deep-amethyst) / <alpha-value>)',
        'warm-coral': 'rgb(var(--color-warm-coral) / <alpha-value>)',
        'rich-plum': 'rgb(var(--color-rich-plum) / <alpha-value>)',
        'golden-amber': 'rgb(var(--color-golden-amber) / <alpha-value>)',
        'soft-rose': 'rgb(var(--color-soft-rose) / <alpha-value>)',
        'sage-green': 'rgb(var(--color-sage-green) / <alpha-value>)',
        
        // Dark mode colors
        dark: {
          bg: {
            primary: 'rgb(var(--color-bg-primary) / <alpha-value>)',
            secondary: 'rgb(var(--color-bg-secondary) / <alpha-value>)',
            tertiary: 'rgb(var(--color-bg-tertiary) / <alpha-value>)',
            elevated: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
          },
          text: {
            primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
            secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
            tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
            muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          },
          accent: {
            amethyst: 'rgb(var(--color-accent-amethyst) / <alpha-value>)',
            coral: 'rgb(var(--color-accent-coral) / <alpha-value>)',
            plum: 'rgb(var(--color-accent-plum) / <alpha-value>)',
            amber: 'rgb(var(--color-accent-amber) / <alpha-value>)',
            rose: 'rgb(var(--color-accent-rose) / <alpha-value>)',
            green: 'rgb(var(--color-accent-green) / <alpha-value>)',
          },
          border: {
            default: 'rgb(var(--color-border-default) / <alpha-value>)',
            emphasis: 'rgb(var(--color-border-emphasis) / <alpha-value>)',
            muted: 'rgb(var(--color-border-muted) / <alpha-value>)',
          },
        },
      },
      backgroundImage: {
        'gradient-memory-learning': 'linear-gradient(135deg, #6B46C1 0%, #F97316 100%)',
        'gradient-wisdom': 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 50%, #EC4899 100%)',
        'gradient-growth': 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)',
        'gradient-transformation': 'linear-gradient(135deg, #7C2D92 0%, #6B46C1 25%, #F97316 75%, #F59E0B 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #FAF5FF 0%, #FFF7ED 50%, #FDF2F8 100%)',
      },
    },
  },
  plugins: [],
}
