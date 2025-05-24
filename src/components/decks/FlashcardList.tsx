'use client';

import type { TFlashcard } from "@/app/dashboard/decks/[deckId]/page"; // Adjust path as needed
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image'; // For displaying flashcard images
import { Edit3, Trash2, Volume2 } from "lucide-react";

interface FlashcardListProps {
  flashcards: TFlashcard[];
  // onEdit: (flashcard: TFlashcard) => void; // Future edit functionality
  // onDelete: (flashcardId: number) => void; // Future delete functionality
}

export default function FlashcardList({ flashcards }: FlashcardListProps) {
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10 border-t mt-6 pt-6">
        <p className="text-lg">This deck is empty.</p>
        <p>Add some flashcards to start learning!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6 pt-6 border-t">
      {flashcards.map((flashcard) => (
        <Card key={flashcard.id} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-gray-800">{flashcard.word}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-700">{flashcard.definition}</p>
            {flashcard.exampleSentence && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600 italic">Example: {flashcard.exampleSentence}</p>
              </div>
            )}
            {flashcard.imageUrl && (
              <div className="mt-2 relative h-48 w-full overflow-hidden rounded-md">
                <Image 
                  src={flashcard.imageUrl} 
                  alt={`Image for ${flashcard.word}`} 
                  layout="fill"
                  objectFit="cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; /* Hide if image fails to load */ }}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end items-center gap-2 pt-2 pb-4 border-t mt-2">
            {flashcard.audioUrl && (
                <Button variant="outline" size="icon" disabled title="Play audio (coming soon)">
                    <Volume2 className="h-4 w-4" />
                </Button>
            )}
            <Button variant="outline" size="icon" disabled title="Edit flashcard (coming soon)">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" disabled title="Delete flashcard (coming soon)">
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 