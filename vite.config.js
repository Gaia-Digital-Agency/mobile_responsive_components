import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
  server: {
    open: false,
    port: 5175,
    strictPort: true,
  },
})
