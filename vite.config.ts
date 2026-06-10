import path from 'path'
import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import type { Plugin } from 'vite'

function mindArCompatPlugin(): Plugin {
  return {
    name: 'mind-ar-compat',
    transform(code, id) {
      if (id.includes('mind-ar') && code.includes('sRGBEncoding')) {
        return code
          .replace(/sRGBEncoding/g, 'SRGBColorSpace')
          .replace(/outputEncoding/g, 'outputColorSpace')
      }
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    basicSsl(),
    mindArCompatPlugin(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 3009,
  },
  optimizeDeps: {
    exclude: ['mind-ar'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    passWithNoTests: true,
  },
})
