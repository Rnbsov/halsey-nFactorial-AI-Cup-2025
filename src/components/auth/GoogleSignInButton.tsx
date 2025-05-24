'use client';

import { Button } from '@/components/ui/button';
import { signInWithGoogleAction } from '@/app/(auth)/actions'; // Adjust path if actions.ts is moved
import { useTransition } from 'react';
import { toast } from '@/components/ui/use-toast';
// You can use a Google icon from lucide-react or another icon library
// import { ChromeIcon } from 'lucide-react'; // Example, ensure lucide-react is installed

// A simple SVG Google icon as a placeholder if you don't want to add a library for one icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#EA4335" d="M24 9.5c3.9 0 6.9 1.6 9.2 3.8l6.9-6.9C35.9 2.3 30.5 0 24 0 14.9 0 7.2 5.3 3.0 12.8l7.6 5.9C12.5 13.2 17.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.9 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h12.9c-.6 2.8-2.2 5.2-4.7 6.8l7.3 5.7C44.5 37.4 46.9 31.5 46.9 24.6z"/>
    <path fill="#FBBC05" d="M10.6 28.7c-.7-2.1-.7-4.4 0-6.5l-7.6-5.9C.9 19.2 0 22.5 0 26s.9 6.8 3 9.7l7.6-5.9z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.7l-7.3-5.7c-2.1 1.4-4.9 2.3-7.9 2.3-6.2 0-11.5-3.7-13.4-8.8l-7.6 5.9C7.2 42.7 14.9 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function GoogleSignInButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignIn = async () => {
    startTransition(async () => {
      const result = await signInWithGoogleAction();
      if (result?.error) {
        toast({
          title: 'Google Sign-In Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
      // Redirect is handled by the server action if successful
    });
  };

  return (
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={handleSignIn} 
      disabled={isPending}
    >
      <GoogleIcon />
      <span className="ml-2">
        {isPending ? 'Redirecting to Google...' : 'Sign in with Google'}
      </span>
    </Button>
  );
} 