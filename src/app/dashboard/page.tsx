import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { CreateDeckDialog } from "@/components/dashboard/CreateDeckDialog";
import { db } from "@/lib/db";
import { decks as decksTable, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import DeckList from "@/components/dashboard/DeckList"; // Import DeckList

// Define a type for the decks we fetch. Exporting so DeckList can use it.
// This SelectResult type can be inferred from Drizzle if you prefer more complex queries later
export type TDeck = typeof decksTable.$inferSelect;
export type DeckWithUserData = TDeck; // For now, same as TDeck. Extend if joining with user data.

async function getDecksForUser(userId: number): Promise<TDeck[]> {
  return db.select().from(decksTable).where(eq(decksTable.userId, userId)).orderBy(decksTable.createdAt);
}

export default async function DashboardPage() {
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
    console.error("Dashboard: Could not find internal user for email:", authUser.email);
    redirect("/login?error=user_profile_not_found"); 
  }

  const userDecks = await getDecksForUser(internalUser.id);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                Halsey Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {authUser.email}!</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">Your Flashcard Decks</h1>
          <p className="mt-1 text-gray-600">Manage your decks and start learning.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">My Decks</h2>
            <CreateDeckDialog />
          </div>
          
          {/* Use DeckList component. It will handle the empty state internally too. */}
          <DeckList decks={userDecks} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Halsey Language Learning. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 