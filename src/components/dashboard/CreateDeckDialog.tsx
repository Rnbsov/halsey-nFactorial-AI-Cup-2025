'use client';

import { useEffect, useState, useRef } from 'react';
import { useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // To close dialog on successful submission or cancel
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // For description
import { createDeckAction, type CreateDeckFormState } from '@/app/dashboard/actions'; // Adjust path as needed
import { toast } from '@/components/ui/use-toast';
import { PlusCircle } from 'lucide-react';

const initialState: CreateDeckFormState = {
  message: undefined,
  fields: {},
  issues: [],
};

export function CreateDeckDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, formAction] = useFormState(createDeckAction, initialState);
  const formRef = useRef<HTMLFormElement>(null); // To reset form

  useEffect(() => {
    if (formState?.message && !formState.issues?.length) { // Success if message and no issues
      toast({
        title: 'Deck Operation',
        description: formState.message,
        variant: formState.issues?.length || formState.message?.toLowerCase().includes('failed') || formState.message?.toLowerCase().includes('error') ? 'destructive' : 'default',
      });
      if (!formState.issues?.length && !formState.message?.toLowerCase().includes('failed') && !formState.message?.toLowerCase().includes('error')) {
        setIsOpen(false); // Close dialog on success
        formRef.current?.reset(); // Reset form fields
      }
    } else if (formState?.message && formState.issues?.length) { // Error with specific field issues
        toast({
            title: 'Error Creating Deck',
            description: formState.issues.join(', ') || 'Please check the form fields.',
            variant: 'destructive',
        });
    }
  }, [formState]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Deck
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Give your new deck a name and an optional description. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={formState?.fields?.name || ''} 
              className="col-span-3" 
              aria-describedby="name-error"
            />
          </div>
          {formState?.issues && formState.fields?.name === undefined && /* Show general name error if not field specific */
            formState.issues.some(issue => issue.toLowerCase().includes('name')) && (
            <p id="name-error" className="text-sm text-red-500 col-span-4 text-right">
              {formState.issues.find(issue => issue.toLowerCase().includes('name'))}
            </p>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={formState?.fields?.description || ''} 
              className="col-span-3" 
              placeholder="Optional: A brief description of your deck"
              aria-describedby="description-error"
            />
          </div>
          {formState?.issues && formState.fields?.description === undefined &&
             formState.issues.some(issue => issue.toLowerCase().includes('description')) && (
            <p id="description-error" className="text-sm text-red-500 col-span-4 text-right">
              {formState.issues.find(issue => issue.toLowerCase().includes('description'))}
            </p>
          )}
          
          {formState?.message && formState.issues && formState.issues.length > 0 && (
            <div className="col-span-4 text-sm text-red-500">
                {/* Display field-specific errors if not handled above, or general errors */}
                {formState.issues.map((issue, index) => <p key={index}>{issue}</p>)}
            </div>
          )}
          {formState?.message && (!formState.issues || formState.issues.length === 0) && formState.message.toLowerCase().includes('failed') && (
             <p className="col-span-4 text-sm text-red-500">{formState.message}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            {/* The submit button for the form is implicitly handled by the form action */}
            {/* We can add a dedicated submit button if needed, but usually the primary button in footer submits */}
            <Button type="submit">Save Deck</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 