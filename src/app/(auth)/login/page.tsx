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
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { useRouter } from 'next/navigation'; // For redirecting after login

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }), // Password can't be empty
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

async function loginUserAction(data: LoginFormValues): Promise<{ error?: string; success?: boolean }> {
  'use server';
  const supabase = createSupabaseServerClient();
  const router = useRouter(); // This won't work in a server action directly

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error('Supabase Login Error:', error);
    // More specific error messages based on error.status or error.code can be added here
    if (error.message === 'Invalid login credentials') {
        return { error: 'Invalid email or password. Please try again.' };
    }
    return { error: error.message };
  }
  
  // Successful login, session is set by Supabase middleware.
  // No need to manually insert into Drizzle table as user should already exist from sign up.
  // Revalidate path or redirect from the client-side after action completes.
  return { success: true };
}

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    const result = await loginUserAction(data);

    if (result.error) {
      toast({
        title: 'Login Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.success) {
      toast({
        title: 'Login Successful!',
        description: 'Welcome back!',
      });
      // Redirect to a protected route or dashboard
      // The middleware should handle session persistence.
      // router.push('/'); // Example redirect to homepage
      // For server actions, redirecting is typically done via `redirect` from `next/navigation`
      // but that needs to be called from the server action itself, or use `router.refresh()` and let middleware handle it.
      router.refresh(); // This will re-fetch server components and middleware will run
      router.push('/'); // Redirect to dashboard or home page
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
          <p className="mt-2 text-sm text-gray-600">Log in to access your Halsey account.</p>
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
                    <Input type="email" placeholder="you@example.com" {...field} className="h-10" />
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
                    <Input type="password" placeholder="••••••••" {...field} className="h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-10 font-semibold" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account? <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">Sign up</a>
        </p>
      </div>
    </div>
  );
} 