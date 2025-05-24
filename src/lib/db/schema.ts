import { pgTable, text, timestamp, serial, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  // Consider adding auth_user_id (uuid) if you want to directly link to supabase.auth.users.id
  // authUserId: uuid('auth_user_id').unique(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const decks = pgTable('decks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const flashcards = pgTable('flashcards', {
  id: serial('id').primaryKey(),
  deckId: integer('deck_id').references(() => decks.id, { onDelete: 'cascade' }).notNull(),
  word: varchar('word', { length: 255 }).notNull(),
  definition: text('definition').notNull(),
  imageUrl: text('image_url'),
  exampleSentence: text('example_sentence'),
  audioUrl: text('audio_url'), // For Vapi.ai TTS or other TTS
  // For spaced repetition (simplified Anki-style)
  // interval: integer('interval').default(1), // days
  // repetitions: integer('repetitions').default(0),
  // easeFactor: decimal('ease_factor', { precision: 4, scale: 2 }).default('2.5'), // Example precision
  // dueDate: timestamp('due_date').defaultNow(), // When the card is next due for review
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
  decks: many(decks),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  deck: one(decks, {
    fields: [flashcards.deckId],
    references: [decks.id],
  }),
}));

// Add your table definitions here 