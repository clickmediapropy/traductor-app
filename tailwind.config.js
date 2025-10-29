/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        neon: { cyan: '#06B6D4', violet: '#8B5CF6', pink: '#EC4899' },
      },
      backgroundImage: {
        aurora: 'radial-gradient(1200px 600px at 10% -10%, rgba(6,182,212,.10), transparent), radial-gradient(1000px 500px at 110% 10%, rgba(139,92,246,.10), transparent)'
      },
      fontFamily: {
        'chinese': ['"Noto Sans SC"', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        'display': ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        neon: '0 0 0 2px rgba(139,92,246,.15), 0 8px 30px rgba(6,182,212,.25)',
        neonSoft: '0 0 0 1px rgba(139,92,246,.12), 0 4px 18px rgba(6,182,212,.18)'
      },
    },
  },
  plugins: [],
}

