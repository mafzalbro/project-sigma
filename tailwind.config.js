/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs', // Include all EJS files in views folder
    './views/partials/**/*.ejs', // Include partials
    './views/layouts/**/*.ejs', // Include layouts
    './public/**/*.html', // Include HTML files in public folder
    './public/**/*.js', // Include JS files if you're using Tailwind in JavaScript
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
