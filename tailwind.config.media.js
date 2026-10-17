// Build config for pages that used the Tailwind CDN with its DEFAULT settings
// (dark: variants follow the visitor's OS setting). Output: static/css/tailwind.media.min.css
module.exports = {
  content: ['./templates/**/*.html', './static/js/**/*.js'],
  theme: { extend: {} },
  plugins: [],
};
