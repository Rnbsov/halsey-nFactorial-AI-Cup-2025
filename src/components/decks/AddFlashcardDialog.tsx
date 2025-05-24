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
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addFlashcardAction, type AddFlashcardFormState } from '@/app/dashboard/decks/actions'; 
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';

const initialState: AddFlashcardFormState = {
  message: undefined,
  fields: {},
  issues: [],
  success: false,
};

interface AddFlashcardDialogProps {
  deckId: number;
  triggerButton?: React.ReactNode; // Optional custom trigger
}

export function AddFlashcardDialog({ deckId, triggerButton }: AddFlashcardDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Pass deckId to the action via initial state or a hidden field if action needs it directly from formData
  // For useFormState, the action receives prevState and formData. We need deckId in formData.
  const [formState, formAction] = useFormState(addFlashcardAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!formState) return;

    if (formState.message) {
      if (formState.success) {
        toast.success('Flashcard Added', { description: formState.message });
      } else {
        toast.error('Error Adding Flashcard', { description: formState.message });
      }
    }

    if (formState.success) {
      setIsOpen(false);
      formRef.current?.reset();
    }
  }, [formState]);

  const trigger = triggerButton ? (
    <DialogTrigger asChild>{triggerButton}</DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New Flashcard
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Flashcard</DialogTitle>
          <DialogDescription>
            Fill in the details for your new flashcard.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Hidden input for deckId so it's part of formData */}
          <input type="hidden" name="deckId" value={deckId} />

          <div>
            <Label htmlFor="word">Word</Label>
            <Input id="word" name="word" defaultValue={formState?.fields?.word as string || ''} />
            {formState?.issues?.find(issue => issue.toLowerCase().includes('word')) && 
             !formState.fields?.word && // Show only if field was empty initially or error is general for word
             <p className="text-sm text-red-500 mt-1">{formState.issues.find(issue => issue.toLowerCase().includes('word'))}</p>}
          </div>

          <div>
            <Label htmlFor="definition">Definition</Label>
            <Textarea id="definition" name="definition" defaultValue={formState?.fields?.definition as string || ''} />
            {formState?.issues?.find(issue => issue.toLowerCase().includes('definition')) && 
             !formState.fields?.definition &&
             <p className="text-sm text-red-500 mt-1">{formState.issues.find(issue => issue.toLowerCase().includes('definition'))}</p>}
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input id="imageUrl" name="imageUrl" placeholder="https://example.com/image.png" defaultValue={formState?.fields?.imageUrl as string || ''} />
            {formState?.issues?.find(issue => issue.toLowerCase().includes('image')) && 
             !formState.fields?.imageUrl &&
            <p className="text-sm text-red-500 mt-1">{formState.issues.find(issue => issue.toLowerCase().includes('image'))}</p>}
          </div>

          <div>
            <Label htmlFor="exampleSentence">Example Sentence (Optional)</Label>
            <Textarea id="exampleSentence" name="exampleSentence" placeholder="E.g., The quick brown fox..." defaultValue={formState?.fields?.exampleSentence as string || ''} />
            {formState?.issues?.find(issue => issue.toLowerCase().includes('sentence')) && 
             !formState.fields?.exampleSentence &&
            <p className="text-sm text-red-500 mt-1">{formState.issues.find(issue => issue.toLowerCase().includes('sentence'))}</p>}
          </div>
          
          {formState?.message && formState.issues && formState.issues.length > 0 && (
             <div className="text-sm text-red-500">
                {formState.issues.filter(issue => 
                    !issue.toLowerCase().includes('word') && 
                    !issue.toLowerCase().includes('definition') &&
                    !issue.toLowerCase().includes('image') &&
                    !issue.toLowerCase().includes('sentence')
                ).map((issue, index) => <p key={index}>{issue}</p>)}
            </div>
          )}
          {formState?.message && !formState.success && (!formState.issues || formState.issues.length === 0) && (
             <p className="text-sm text-red-500">{formState.message}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Flashcard</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 