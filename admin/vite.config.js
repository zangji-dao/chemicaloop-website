import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".mjs", ".js", ".jsx", ".json", ".vue", ".css", ".scss"],
  },
  server: {
    port: 5001,
    host: "0.0.0.0",
    headers: {
      "Content-Security-Policy":
        "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data:; script-src * self 'unsafe-inline' 'unsafe-eval' blob: data:; img-src * self 'unsafe-inline' blob: data:; connect-src * self blob: data:; font-src * self blob: data:;",
    },
  },
});
