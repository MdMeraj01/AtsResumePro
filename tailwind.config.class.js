// Build config for pages that used the CDN with `darkMode: 'class'`.
// Output: static/css/tailwind.class.min.css
// It is the union of the inline tailwind.config blocks those pages had.
// (contact_us and help_center both defined `pulse-slow` with a different easing; the Tailwind default easing is used.)
module.exports = {
  darkMode: 'class',
  content: ['./templates/**/*.html', './static/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00d4ff',
        'neon-purple': '#8b5cf6',
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'dark-sidebar': '#0f172a',
        dark: { bg: '#0f172a', card: '#1e293b', 800: '#1e293b', 900: '#0f172a' },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
