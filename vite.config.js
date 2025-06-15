import { defineConfig } from 'vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
resolve: {
    alias: {
      "@app": path.resolve("src/"),
      "@root": path.resolve("."),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  }
})
