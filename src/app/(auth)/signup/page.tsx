'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // For server actions
import { db } from '@/lib/db'; // Drizzle instance
import { users } from '@/lib/db/schema'; // Users table schema
import { redirect } from 'next/navigation';

const signupFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

async function signUpUserAction(data: SignupFormValues): Promise<{ error?: string; success?: boolean; data?: any }> {
  'use server';
  const supabase = createSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
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
    const [newUser] = await db
      .insert(users)
      .values({
        // id: authData.user.id, // If your users.id is uuid and should match Supabase auth.users.id
        // If your users.id is serial, Drizzle handles it. Ensure your schema matches this intent.
        email: authData.user.email!,
        // You might want to add other fields here, e.g., a foreign key to auth.users.id if your `users.id` is serial
        // For example: authUserId: authData.user.id
      })
      .returning(); // Optional: if you want the newly created user back
    
    console.log('User created in DB:', newUser);
    // Note: Supabase by default might require email confirmation.
    // The user object from signUp will have a null session until confirmed if email confirmation is enabled.
    return { success: true, data: { supabaseUser: authData.user, dbUser: newUser } };
  } catch (dbError: any) {
    console.error('Database Insert Error:', dbError);
    // Potentially handle user cleanup in Supabase auth if DB insert fails, though this can be complex.
    // For now, just return an error.
    return { error: `Failed to save user information after sign up: ${dbError.message}` };
  }
}

export default function SignupPage() {
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: SignupFormValues) {
    const result = await signUpUserAction(data);
    if (result.error) {
      toast({
        title: 'Sign Up Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.success) {
      toast({
        title: 'Sign Up Successful!',
        // description: 'Please check your email to verify your account.', // Adjust if email confirmation is off
        description: result.data?.supabaseUser?.identities?.length === 0 
          ? 'Sign up successful! You can now log in.' 
          : 'Please check your email to verify your account.',
      });
      // if Supabase email confirmation is OFF, user might be logged in directly or can log in.
      // if Supabase email confirmation is ON, user needs to verify.
      // For now, let's redirect to login, or a page that says "check your email"
      // Consider redirecting to a specific page after signup, e.g., /auth/confirm-email or /login
      // redirect('/login'); 
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Create Your Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join Halsey to start your language learning journey!</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} className="h-10"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-10"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-10"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-10 font-semibold" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
         <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account? <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Log in</a>
        </p>
      </div>
    </div>
  );
} 