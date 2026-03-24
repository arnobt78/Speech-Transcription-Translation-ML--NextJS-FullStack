/** Tailwind CSS v4 PostCSS plugin — processes `@import "tailwindcss"` in globals.css */
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
