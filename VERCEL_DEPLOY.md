# Deploy SI Social to Vercel

This copy has been converted from the Cloudflare/Wrangler build path to the Vercel + Nitro build path for TanStack Start.

## Vercel project settings

If your GitHub repo contains the outer `SI SOCIAL` folder, set:

```txt
Root Directory: staten-social-map
```

If your repo contains only the app folder contents, leave Root Directory blank.

Use:

```txt
Install Command: npm install
Build Command: npm run build
```

Do not set an Output Directory manually. Nitro/Vercel handles the server output.

## Required environment variables

Add these in Vercel Project Settings -> Environment Variables:

```txt
VITE_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
SYNC_TICKER_SECRET
OFFICIAL_ALERT_RSS_URLS
OFFICIAL_ALERT_JSON_URLS
```

Use the values from your local `.env.local`, but do not commit `.env.local` to GitHub.

## What changed

- Added `nitro` dependency.
- Disabled the Cloudflare Vite plugin in `vite.config.ts`.
- Added the Nitro Vite plugin.
- Added `start` and `vercel-build` scripts.
- Added `vercel.json` with Vercel install/build commands.
- Kept `wrangler.jsonc` in the source for reference, but Vercel ignores it.

## Local test

```bash
npm install
npm run build
npm start
```

Then open the local URL printed by Node.
