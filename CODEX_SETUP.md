# SI Social — Codex Setup Guide

This codebase is **fully scaffolded** for Clerk auth + Supabase data + Vercel hosting. Every place that needs a real API call is marked with `TODO(codex):`. Follow this guide top-to-bottom.

---

## 0. What's already done

- ✅ All UI routes built: `/sign-in`, `/sign-up`, `/onboarding`, `/profile/edit`, `/me`, `/create`, plus feed/news/restaurants/events/rooms.
- ✅ `useAuth()` + `useProfile()` hooks in `src/lib/auth.tsx` (currently mock; persists to `localStorage`).
- ✅ Profile types + stub data layer in `src/lib/profile.ts`.
- ✅ `<AvatarUpload />` component in `src/components/AvatarUpload.tsx`.
- ✅ Supabase migration in `supabase/migrations/0001_profiles_and_avatars.sql` (creates `profiles` table + `avatars` storage bucket + RLS using Clerk's `auth.jwt() ->> 'sub'`).

Search the repo for `TODO(codex)` to see every replacement point.

---

## 1. Clerk dashboard setup

1. Create an app at https://dashboard.clerk.com.
2. Enable sign-in methods: **Email**, **Google**, **Apple**.
3. **JWT Templates → New template → Supabase preset**.
4. Copy the **Publishable Key** (`pk_...`) and **Secret Key** (`sk_...`).

## 2. Supabase project setup

1. Create a Supabase project at https://supabase.com.
2. Apply the migration:
   ```bash
   supabase db push   # or paste supabase/migrations/0001_profiles_and_avatars.sql into the SQL editor
   ```
3. Project Settings → API: copy **Project URL**, **anon public key**, **service role key**.
4. Project Settings → API → **JWT Secret**: copy this value, paste into Clerk's Supabase JWT template under **Signing key**.
5. **Authentication → Providers → enable "Third-party auth"** and add Clerk as a provider (paste your Clerk Frontend API URL there). Recent Supabase docs: https://supabase.com/docs/guides/auth/third-party/clerk

## 3. Environment variables (Vercel)

Add these in Vercel Project → Settings → Environment Variables (and `.env.local` for dev):

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...   # anon public key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...        # server-only, never VITE_ prefix
```

## 4. Install dependencies

```bash
bun add @clerk/tanstack-react-start @supabase/supabase-js
```

## 5. Code changes (in order)

### 5a. Wrap the app in `<ClerkProvider>`

`src/routes/__root.tsx` — wrap `<AuthProvider>` with Clerk:

```tsx
import { ClerkProvider } from "@clerk/tanstack-react-start";

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <AuthProvider>
    <Outlet />
  </AuthProvider>
</ClerkProvider>;
```

### 5b. Replace `src/lib/auth.tsx`

Swap the body of `AuthProvider` and `useAuth` to read from Clerk and fetch the matching profile row from Supabase. Keep the **exported shape identical** (`isLoaded`, `isSignedIn`, `userId`, `profile`, `signOut`) — no other file needs to change.

```tsx
import {
  useUser,
  useAuth as useClerk,
  useClerk as useClerkActions,
} from "@clerk/tanstack-react-start";
import { supabase } from "@/integrations/supabase/client";

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useClerk();
  const { signOut } = useClerkActions();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user) {
      setProfile(null);
      return;
    }
    (async () => {
      const token = await getToken({ template: "supabase" });
      supabase.auth.setSession({ access_token: token!, refresh_token: "" });
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("clerk_user_id", user.id)
        .maybeSingle();
      setProfile(data);
    })();
  }, [isSignedIn, user, getToken]);

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: !!isSignedIn,
        userId: user?.id ?? null,
        profile,
        signOut: () => signOut(),
        _devSignIn: () => {}, // no-op in prod
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### 5c. Replace `src/lib/profile.ts` stubs

Implement `updateProfile`, `getProfileByHandle`, `uploadAvatar` using `supabase.from("profiles")` and `supabase.storage.from("avatars")`. The function signatures are already correct — only the bodies change.

### 5d. Replace `/sign-in` and `/sign-up` routes

The easy route is to delete the custom form and drop in Clerk's prebuilt components:

```tsx
// src/routes/sign-in.tsx
import { SignIn } from "@clerk/tanstack-react-start";
export const Route = createFileRoute("/sign-in")({
  component: () => (
    <PageShell title="Sign in" kicker="Welcome back">
      <SignIn routing="path" path="/sign-in" />
    </PageShell>
  ),
});
```

(Same pattern for `sign-up.tsx`.)

### 5e. Replace `/create` post stub

In `src/routes/create.tsx` find `// TODO(codex): replace this stub` — swap for a real `supabase.from("posts").insert(...)` once you add a `posts` table migration.

### 5f. Remove dev sign-in button

In `src/routes/me.tsx` delete the `dev · use demo profile` button and the `_devSignIn` field on the auth context.

---

## 6. Deploy to Vercel

The project currently targets Cloudflare Workers (`src/server.ts`, `wrangler.jsonc`). To move to Vercel:

1. Delete `src/server.ts` and `wrangler.jsonc`.
2. In `vite.config.ts`, change the TanStack Start target:
   ```ts
   import { tanstackStart } from "@tanstack/react-start/plugin/vite";
   export default defineConfig({
     plugins: [tanstackStart({ target: "vercel" })],
   });
   ```
3. Push to GitHub, import the repo in Vercel, paste in the env vars from step 3.
4. Vercel auto-detects TanStack Start and deploys.

---

## 7. Smoke test

- [ ] Sign up with email → lands on `/onboarding`
- [ ] Pick handle + ZIP + avatar → lands on `/me` with profile shown
- [ ] Refresh → still signed in, profile loads from Supabase
- [ ] Sign in with Google works
- [ ] `/profile/edit` saves changes
- [ ] Avatar upload appears in `avatars` bucket under `<clerk_user_id>/...`
- [ ] RLS prevents updating another user's profile (test via SQL editor)

Done.
