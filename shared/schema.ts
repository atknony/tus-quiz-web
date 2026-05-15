import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export interface QuestionTiming {
  questionId: number;
  servedAt: string;
  answeredAt: string | null;
  selectedAnswer: string | null;
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  university: text("university").notNull(),
  role: text("role").notNull().default("user"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  options: text("options").array().notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  category: text("category").notNull(),
  section: text("section"),
  difficulty: text("difficulty").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  difficulty: text("difficulty").notNull(),
  section: text("section").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  wrongAnswers: integer("wrong_answers").notNull(),
  totalTime: integer("total_time").notNull(),
  score: integer("score").notNull().default(0),
  mode: text("mode").notNull().default("competitive"),
  status: text("status").notNull().default("abandoned"),
  maxStreak: integer("max_streak").notNull().default(0),
  totalQuestionsAnswered: integer("total_questions_answered").notNull().default(0),
  accuracyRate: real("accuracy_rate").notNull().default(0),
  avgTimePerQuestion: real("avg_time_per_question").notNull().default(0),
  categoryPerformance: jsonb("category_performance")
    .$type<Record<string, { correct: number; wrong: number }>>()
    .notNull()
    .default({}),
  schemaVersion: integer("schema_version").notNull().default(1),
  chosenQuestionIds: jsonb("chosen_question_ids")
    .$type<number[]>()
    .notNull()
    .default([]),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  questionTimings: jsonb("question_timings")
    .$type<QuestionTiming[]>()
    .notNull()
    .default([]),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  idxUserStatusScore: index("idx_games_user_status_score").on(table.userId, table.status, table.score),
}));

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: integer("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'blocked'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uqRequesterAddressee: uniqueIndex("uq_friendships_requester_addressee").on(table.requesterId, table.addresseeId),
  idxRequesterStatus: index("idx_friendships_requester_status").on(table.requesterId, table.status),
  idxAddresseeStatus: index("idx_friendships_addressee_status").on(table.addresseeId, table.status),
}));

// Relations (used for future join queries)
export const usersRelations = relations(users, ({ many }) => ({
  games: many(games),
  emailVerifications: many(emailVerifications),
  sentFriendRequests: many(friendships, { relationName: "requester" }),
  receivedFriendRequests: many(friendships, { relationName: "addressee" }),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  user: one(users, { fields: [games.userId], references: [users.id] }),
}));

export const emailVerificationsRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, { fields: [emailVerifications.userId], references: [users.id] }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, { fields: [friendships.requesterId], references: [users.id], relationName: "requester" }),
  addressee: one(users, { fields: [friendships.addresseeId], references: [users.id], relationName: "addressee" }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  dateOfBirth: true,
  university: true,
  role: true,
  isEmailVerified: true,
}).partial({ role: true, isEmailVerified: true });

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
}).partial({ userId: true });

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
}).partial({ status: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;
export type EmailVerification = typeof emailVerifications.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Use drizzle's native inferred insert type so jsonb `.$type<>()` annotations
// (chosenQuestionIds, questionTimings, categoryPerformance) carry through.
// The zod-derived schema (kept for runtime validation use cases) loses these.
export type InsertGame = typeof games.$inferInsert;
export type Game = typeof games.$inferSelect;

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;
