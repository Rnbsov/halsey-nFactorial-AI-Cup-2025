'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { flashcards, decks, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const FlashcardSchema = z.object({
  deckId: z.coerce.number().int().positive({ message: 'Deck ID is required.'}), // coerce to number
  word: z.string().min(1, { message: 'Word is required.' }).max(255),
  definition: z.string().min(1, { message: 'Definition is required.' }),
  imageUrl: z.string().url({ message: 'Invalid URL format for image.' }).optional().or(z.literal('')),
  exampleSentence: z.string().max(500).optional().or(z.literal('')),
  // audioUrl: z.string().url().optional(), // For Vapi or other TTS later
});

export type AddFlashcardFormState = {
  message?: string;
  fields?: Record<string, string | number>; // deckId can be number
  issues?: string[];
  success?: boolean;
} | undefined;

export async function addFlashcardAction(
  prevState: AddFlashcardFormState,
  formData: FormData
): Promise<AddFlashcardFormState> {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser || !authUser.email) {
    return { message: 'Authentication failed. Please log in again.' };
  }

  const internalUser = await db.query.users.findFirst({
    where: eq(users.email, authUser.email),
    columns: { id: true },
  });

  if (!internalUser) {
    return { message: 'User profile not found. Cannot add flashcard.' };
  }
  
  const rawFormData = {
    deckId: formData.get('deckId'),
    word: formData.get('word'),
    definition: formData.get('definition'),
    imageUrl: formData.get('imageUrl') || undefined, // Ensure empty strings become undefined for optional fields
    exampleSentence: formData.get('exampleSentence') || undefined,
  };

  const validatedFields = FlashcardSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const issues = validatedFields.error.issues.map((issue) => issue.message);
    return {
      message: 'Invalid form data.',
      fields: Object.fromEntries(formData.entries()) as Record<string, string | number>,
      issues,
      success: false,
    };
  }

  // Verify that the deck belongs to the authenticated user
  try {
    const deck = await db.query.decks.findFirst({
      where: and(eq(decks.id, validatedFields.data.deckId), eq(decks.userId, internalUser.id)),
      columns: { id: true }, // Only need to confirm existence and ownership
    });

    if (!deck) {
      return {
        message: 'Deck not found or you do not have permission to add flashcards to it.',
        fields: validatedFields.data as Record<string, string | number>,
        success: false,
      };
    }

    // Insert the flashcard
    const [newFlashcard] = await db.insert(flashcards).values({
      deckId: validatedFields.data.deckId,
      word: validatedFields.data.word,
      definition: validatedFields.data.definition,
      imageUrl: validatedFields.data.imageUrl || null, // Store null if empty/undefined
      exampleSentence: validatedFields.data.exampleSentence || null,
      // audioUrl will be handled later
      updatedAt: new Date(), // Schema defaultNow() handles createdAt
    }).returning();

    revalidatePath(`/dashboard/decks/${validatedFields.data.deckId}`); // Revalidate specific deck page
    return { 
        message: `Flashcard "${newFlashcard.word}" added successfully!`, 
        success: true, 
        issues: [] 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Failed to add flashcard:", error);
    return {
      message: `Failed to add flashcard: ${errorMessage}`,
      fields: validatedFields.data as Record<string, string | number>,
      success: false,
    };
  }
} 