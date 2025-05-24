'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from '@/lib/db'; // Drizzle instance
import { users } from '@/lib/db/schema'; // Users table schema
import type { User } from '@supabase/supabase-js'; // Import Supabase User type

// Import only the necessary types from the new schema file
import type { SignupFormValues, LoginFormValues } from '@/lib/schemas/auth';

// Define a more specific type for the success data
export type SignUpSuccessData = {
  supabaseUser: User | null;
  dbUser: typeof users.$inferSelect | null; // Or your specific Drizzle user type
};

// Server action for user signup
export async function signUpUserAction(data: SignupFormValues): Promise<{ error?: string; success?: boolean; data?: SignUpSuccessData | null }> {
  const supabaseClient = await createSupabaseServerClient();

  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      // emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`, // Optional: if you have email confirmation redirect
    },
  });

  if (authError) {
    console.error('Supabase Auth Error:', authError);
    return { error: authError.message };
  }

  if (!authData.user) {
    console.error('Supabase Auth Error: No user data returned after sign up.');
    return { error: 'An unexpected error occurred during sign up. No user data found.' };
  }

  // If Supabase auth is successful, create a record in your public users table
  try {
    const [newUserRecord] = await db
      .insert(users)
      .values({
        email: authData.user.email!,
      })
      .returning(); 
    
    console.log('User created in DB:', newUserRecord);
    return { success: true, data: { supabaseUser: authData.user, dbUser: newUserRecord || null } };
  } catch (dbError: unknown) {
    console.error('Database Insert Error:', dbError);
    // Potentially handle user cleanup in Supabase auth if DB insert fails, though this can be complex.
    // For now, just return an error.
    let errorMessage = 'An unknown error occurred';
    if (dbError instanceof Error) {
      errorMessage = `Failed to save user information after sign up: ${dbError.message}`;
    }
    return { error: errorMessage };
  }
}

// Server action for user login
export async function loginUserAction(data: LoginFormValues): Promise<{ error?: string } | void> { // Returns void on success due to redirect
  const supabaseClient = await createSupabaseServerClient();

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error('Supabase Login Error:', error);
    if (error.message === 'Invalid login credentials') {
        return { error: 'Invalid email or password. Please try again.' };
    }
    return { error: error.message };
  }
  
  // Successful login, redirect to dashboard/home
  redirect('/'); 
}

export async function logoutAction() {
  const supabaseClient = await createSupabaseServerClient();
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error('Supabase Logout Error:', error);
    return { error: error.message };
  }
  
  return redirect("/login");
}

export async function signInWithGoogleAction() {
  'use server';
  const supabaseClient = await createSupabaseServerClient();

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
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