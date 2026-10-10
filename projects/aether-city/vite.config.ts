import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: { dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'] },
  optimizeDeps: { include: ['react', 'react-dom/client', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier', '@react-three/postprocessing', 'postprocessing', 'zustand', 'leva'] },
  server: { port: 5173, strictPort: true },
  build: {
    chunkSizeWarningLimit: 1800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'rapier-wasm', test: /@dimforge/ }],
        },
      },
    },
  },
})
