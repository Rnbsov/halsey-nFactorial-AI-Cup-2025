'use client';

import type { DeckWithUserData } from "@/app/dashboard/page"; // Adjust path if page.tsx is moved or type is co-located
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit3, Trash2, PlayCircle } from "lucide-react"; // Icons

interface DeckListProps {
  decks: DeckWithUserData[];
}

export default function DeckList({ decks }: DeckListProps) {
  if (!decks || decks.length === 0) {
    // This case should be handled by the parent component, but as a fallback:
    return (
      <div className="text-center text-gray-500 py-10">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-xl font-semibold">No decks found.</p>
        <p>Create your first deck to start learning!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map((deck) => (
        <Card key={deck.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{deck.name}</CardTitle>
            {deck.description && (
              <CardDescription className="text-sm text-gray-600 mt-1">
                {deck.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-grow">
            {/* Placeholder for more deck info, like number of cards */}
            <p className="text-xs text-gray-500">Created: {new Date(deck.createdAt).toLocaleDateString()}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center gap-2 border-t pt-4">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/dashboard/decks/${deck.id}/study`}> {/* Future study page */}
                <PlayCircle className="mr-2 h-4 w-4" /> Study
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/dashboard/decks/${deck.id}`}> {/* Future view/edit page */}
                 <Edit3 className="mr-2 h-4 w-4" /> View/Edit
              </Link>
            </Button>
            {/* Delete button - requires a server action and confirmation dialog */}
            {/* <Button variant="destructive" size="sm" disabled className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button> */}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 