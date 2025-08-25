import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// USTAW base na '/NAZWA-REPO/' dla GitHub Pages project site
export default defineConfig({
  plugins: [react()],
  base: '/NAZWA-REPO/',
})
