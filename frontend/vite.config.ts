import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        showcase: path.resolve(__dirname, "showcase.html"),
        chatShowcase: path.resolve(__dirname, "chat-showcase.html"),
        uiShowcase: path.resolve(__dirname, "ui-showcase.html"),
      },
    },
  },
})
