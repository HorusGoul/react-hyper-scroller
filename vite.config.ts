import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "./lib/index.ts"),
      name: "react-hyper-scroller",
      fileName: (format) => `react-hyper-scroller.${format}.js`,
    },

    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "object-assign"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  plugins: [react()],
});