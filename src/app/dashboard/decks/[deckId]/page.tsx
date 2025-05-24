import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decks as decksTable, users, flashcards as flashcardsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddFlashcardDialog } from "@/components/decks/AddFlashcardDialog";
import FlashcardList from "@/components/decks/FlashcardList";

// Types for data
export type TDeck = typeof decksTable.$inferSelect;
export type TFlashcard = typeof flashcardsTable.$inferSelect;

async function getDeckDetails(deckId: number, internalUserId: number): Promise<TDeck | null> {
  const deck = await db.query.decks.findFirst({
    where: and(eq(decksTable.id, deckId), eq(decksTable.userId, internalUserId)),
    // with: { flashcards: true } // Optionally load flashcards here directly
  });
  return deck || null;
}

async function getFlashcardsForDeck(deckId: number): Promise<TFlashcard[]> {
  return db.select().from(flashcardsTable).where(eq(flashcardsTable.deckId, deckId)).orderBy(flashcardsTable.createdAt);
}

interface DeckPageProps {
  params: {
    deckId: string;
  };
}

export default async function SingleDeckPage({ params }: DeckPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser || !authUser.email) {
    redirect("/login");
  }

  const internalUser = await db.query.users.findFirst({
    where: eq(users.email, authUser.email),
    columns: { id: true },
  });

  if (!internalUser) {
    redirect("/login?error=user_profile_not_found");
  }

  const deckId = parseInt(params.deckId, 10);
  if (isNaN(deckId)) {
    return <p>Invalid deck ID.</p>; // Or a proper not-found page
  }

  const deck = await getDeckDetails(deckId, internalUser.id);

  if (!deck) {
    // This means deck not found OR deck does not belong to the user
    // Consider a more specific not-found or unauthorized component
    return <p>Deck not found or you do not have permission to view it.</p>; 
  }

  const flashcards = await getFlashcardsForDeck(deck.id);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Simplified Header for this page, can be a shared layout component later */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
            <h1 className="text-xl font-semibold text-indigo-600 truncate" title={deck.name}>Deck: {deck.name}</h1>
            <AddFlashcardDialog deckId={deck.id} />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {deck.description && (
          <p className="mb-6 text-gray-700 bg-indigo-50 p-4 rounded-md">{deck.description}</p>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-0">
            Flashcards ({flashcards.length})
          </h2>
          <FlashcardList flashcards={flashcards} />
        </div>
      </main>
    </div>
  );
} 