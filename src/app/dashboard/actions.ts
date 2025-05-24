'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { decks, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const DeckSchema = z.object({
  name: z.string().min(1, { message: 'Deck name is required.' }).max(100, { message: 'Deck name must be 100 characters or less.' }),
  description: z.string().max(255, { message: 'Description must be 255 characters or less.' }).optional(),
});

export type CreateDeckFormState = {
  message?: string;
  fields?: Record<string, string>;
  issues?: string[];
} | undefined;

export async function createDeckAction(
  prevState: CreateDeckFormState,
  formData: FormData
): Promise<CreateDeckFormState> {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return {
      message: 'Authentication failed. Please log in again.',
    };
  }

  let internalUserRecord;
  if (authUser.email) {
    try {
      internalUserRecord = await db.query.users.findFirst({
        where: eq(users.email, authUser.email),
        columns: { id: true },
      });
    } catch (e) {
      console.error('Error fetching internal user by email:', e);
      return { message: 'Error verifying user information. Please try again.' };
    }
  }

  if (!internalUserRecord) {
    console.error('Internal user record not found for email:', authUser.email);
    return { message: 'User profile not found in our system. Cannot create deck.' };
  }

  const validatedFields = DeckSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    const issues = validatedFields.error.issues.map((issue) => issue.message);
    return {
      message: 'Invalid form data.',
      fields: Object.fromEntries(formData.entries()) as Record<string, string>,
      issues,
    };
  }

  try {
    const [newDeck] = await db.insert(decks).values({
      userId: internalUserRecord.id,
      name: validatedFields.data.name,
      description: validatedFields.data.description,
    }).returning();

    revalidatePath('/dashboard');
    return { message: `Deck "${newDeck.name}" created successfully!`, issues: [] };

  } catch (dbError) {
    const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
    console.error("Failed to create deck in DB:", dbError);
    return {
      message: `Failed to create deck: ${errorMessage}`,
      fields: validatedFields.data as Record<string, string>,
    };
  }
} 