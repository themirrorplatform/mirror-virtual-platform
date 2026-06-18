import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The platform is a Vite-React SPA (Everything Spec §13). Server-true <head>
// per /t/ and /c/ is delivered by a Netlify edge function (SEO §2 / D1), wired
// in a later step — not by client-side meta.
export default defineConfig({
  plugins: [react()],
});
