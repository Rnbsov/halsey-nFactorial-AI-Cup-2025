'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { toast } from 'sonner';
import { redirect } from 'next/navigation';

// Import the action from actions.ts and schemas/types from new schema file
import { signUpUserAction } from '../actions';
import { signupFormSchema, type SignupFormValues } from '@/lib/schemas/auth';

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
      toast.error(result.error, {
        // Sonner uses description for more details, or you can customize components
      });
    } else if (result.success) {
      // Assuming result.data is { supabaseUser: { identities?: any[] }, dbUser: any } | null from the action
      const supabaseUser = result.data?.supabaseUser as { identities?: any[] } | undefined;
      const descriptionMessage = supabaseUser?.identities?.length === 0 
          ? 'Sign up successful! You can now log in.' 
          : 'Please check your email to verify your account.';
      toast.success('Sign Up Successful!', {
        description: descriptionMessage,
      });
      redirect('/login');
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