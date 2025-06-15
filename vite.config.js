import { defineConfig } from 'vite'
import path from "path"
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, './index.ts'),
      name: 'nanosignal-ts',
      fileName: (format) => `index.js`,
      formats: ['es']
    },
    outDir: 'dist',
    sourcemap: true,
    minify: true,
    emptyOutDir: false, // Changed to false to prevent deletion of d.ts files
    rollupOptions: {
      external: [],
      output: {
        preserveModules: true,
        exports: 'named'
      }
    }
  },
  resolve: {
    alias: {
      "@app": path.resolve("src/"),
      "@root": path.resolve("."),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  }
})
