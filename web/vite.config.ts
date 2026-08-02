import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), checker({ typescript: true })],
  resolve: {
    tsconfigPaths: true,
  },
});
