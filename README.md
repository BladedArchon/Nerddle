Nerddle - Vite + React + Tailwind prototype
-------------------------------------------

This is the Nerddle frontend prototype (single-file React app split into src/App.jsx). It uses localStorage for persistence (users, blogs, sessions).

Quick start:
1. Install dependencies
   npm install

2. Run dev server
   npm run dev

3. Build for production
   npm run build

4. Preview production build
   npm run preview

Netlify:
- This repo includes netlify.toml and a _redirects file in /public to support SPA routing.
- When deploying on Netlify, use the build command `npm run build` and publish directory `dist`.
