import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Library build: one self-contained IIFE (React + Framer Motion inlined) that the
// static hub loads and mounts for the role select view. Output goes into
// deploy/hub/roles.js. emptyOutDir is false so the hub's own index.html survives.
export default defineConfig({
  plugins: [react()],
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    outDir: "../deploy/hub",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/main.jsx",
      name: "ContinuumRolesView",
      formats: ["iife"],
      fileName: () => "roles.js"
    }
  }
});
