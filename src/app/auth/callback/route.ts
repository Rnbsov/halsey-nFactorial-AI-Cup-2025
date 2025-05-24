import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin; // Used for redirecting back to the app

  if (code) {
    const supabase = createSupabaseServerClient();
    try {
      const { error: exchangeError, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Supabase code exchange error:', exchangeError);
        return NextResponse.redirect(`${origin}/login?error=Could not authenticate user. Code exchange failed.`);
      }

      // At this point, the user should be authenticated with Supabase, and the session is set in cookies by the helper.
      // Now, let's get the user details from Supabase to upsert into our Drizzle table.
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !user) {
        console.error('Supabase getUser error after code exchange:', getUserError);
        return NextResponse.redirect(`${origin}/login?error=Could not retrieve user information after authentication.`);
      }

      // Upsert user into our Drizzle 'users' table
      if (user.email) {
        try {
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, user.email!),
          });

          if (existingUser) {
            // User exists, potentially update `updatedAt` or other fields if necessary
            await db.update(users)
              .set({ updatedAt: new Date() /*, authProviderId: user.id // if you add this field */ })
              .where(eq(users.id, existingUser.id));
            console.log('Existing user updated in DB:', existingUser.email);
          } else {
            // User does not exist, create them
            const [newDbUser] = await db.insert(users).values({
              email: user.email!,
              // id: user.id, // if your users.id is uuid and should map to Supabase auth.users.id
              // otherwise, if serial, Drizzle handles it. You might want an auth_user_id field.
              // authProviderId: user.id, // Example: if you add a field to link to Supabase user ID
              createdAt: new Date(), // Explicitly set if not relying on defaultNow() in some edge cases or for consistency
              updatedAt: new Date(),
            }).returning();
            console.log('New user created in DB via OAuth:', newDbUser?.email);
          }
        } catch (dbUpsertError: any) {
          console.error('Drizzle upsert error after OAuth:', dbUpsertError);
          // Even if DB upsert fails, user is authenticated with Supabase. 
          // Decide on redirect strategy. For now, redirect to login with an error.
          return NextResponse.redirect(`${origin}/login?error=Authenticated, but failed to save user profile: ${dbUpsertError.message}`);
        }
      } else {
        console.warn('User authenticated via OAuth but has no email. Cannot upsert to DB without email.');
        // This is an edge case. OAuth provider might not have sent an email.
        // Redirect with a specific error or to a page where user can provide an email.
        return NextResponse.redirect(`${origin}/login?error=Authentication successful, but no email provided by OAuth provider.`);
      }

      // Successfully authenticated and user profile upserted (or attempted)
      return NextResponse.redirect(`${origin}/`); // Redirect to home/dashboard

    } catch (e: any) {
      console.error('Generic error in OAuth callback:', e);
      return NextResponse.redirect(`${origin}/login?error=An unexpected error occurred during authentication.`);
    }
  }

  // If no code is present, or an error occurred before code exchange attempt
  console.error('OAuth callback called without a code.');
  return NextResponse.redirect(`${origin}/login?error=Authentication failed. No code received.`);
} 