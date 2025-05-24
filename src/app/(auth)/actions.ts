'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Supabase Logout Error:', error);
    // Optionally, you could return an error object to be handled by the client
    // For logout, redirecting is usually sufficient even on error, or display a generic error page.
    return { error: error.message }; 
  }
  
  // Redirect to login page after successful logout
  // Or to the homepage, depending on desired UX
  return redirect("/login"); 
}

export async function signInWithGoogleAction() {
  'use server';
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`, // Your app's auth callback route
      // queryParams: { access_type: 'offline', prompt: 'consent' } // Optional: for refresh tokens, re-prompt consent
    },
  });

  if (error) {
    console.error('Supabase Google OAuth Error:', error);
    return { error: `Google Sign-In failed: ${error.message}` };
  }

  if (data.url) {
    return redirect(data.url); // Redirect to Google's OAuth consent screen
  } else {
    // This case should ideally not happen if Supabase client is working correctly
    return { error: 'Google Sign-In failed: No URL returned from Supabase.' };
  }
} 