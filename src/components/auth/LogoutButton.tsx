'use client';

import { Button } from '@/components/ui/button';
import { logoutAction } from '@/app/(auth)/actions'; // Adjust path if actions.ts is moved
import { LogOut } from 'lucide-react'; // Optional: for an icon
import { useTransition } from 'react';
import { toast } from '@/components/ui/use-toast';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    startTransition(async () => {
      const result = await logoutAction();
      if (result?.error) {
        toast({
          title: 'Logout Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        // Success toast can be added, but redirect often happens too fast
        // toast({ title: 'Logged Out', description: 'You have been successfully logged out.'});
        // Redirect is handled by the server action
      }
    });
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout} 
      disabled={isPending}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isPending ? 'Logging Out...' : 'Logout'}
    </Button>
  );
} 