import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as dotenv from 'dotenv';

dotenv.config({
  path: '.env.local',
});

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

// Utility to create a Supabase client for server actions
// This client has access to the service role key and can bypass RLS.
// Only use this for operations that require admin privileges.
export function createSupabaseServerAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local for admin client');
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // No-op cookie handling for admin client as it's not request-bound in the same way
        get() { return undefined; },
        set() { /* no-op */ },
        remove() { /* no-op */ },
      },
      // It's good practice to explicitly state auth options if needed,
      // though for service role, it often bypasses standard auth flows.
      // auth: {
      //   persistSession: false, // Typically, service roles don't persist sessions
      //   autoRefreshToken: false,
      // }
    }
  );
} 