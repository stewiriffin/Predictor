/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original colors
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'accent-green': '#10b981',

        // Cyberpunk Sports Theme
        'cyber-dark': '#0a0e1a',
        'cyber-darker': '#060913',
        'cyber-slate': '#1a1f35',

        // Neon Colors
        'neon-teal': '#00f0ff',      // Home team accent
        'neon-magenta': '#ff00ff',   // Away team accent
        'neon-cyan': '#00ffff',
        'neon-pink': '#ff007f',
        'neon-purple': '#b026ff',
        'neon-yellow': '#ffff00',
        'neon-orange': '#ff6600',

        // Dimmed Neon (for backgrounds)
        'dim-teal': '#004d55',
        'dim-magenta': '#550055',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'neon-teal': '0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.5)',
        'neon-glow': '0 0 30px rgba(0, 255, 255, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 1)' },
        }
      }
    },
  },
  plugins: [],
}
