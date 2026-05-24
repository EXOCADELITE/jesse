// Vercel/TanStack Start deployment config.
// The original project was generated with Lovable's Cloudflare build path.
// For Vercel, disable Cloudflare and add Nitro so Vercel can build server functions.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  cloudflare: false,
  plugins: [nitro()],
  tanstackStart: {
    server: { entry: "server" },
  },
});
