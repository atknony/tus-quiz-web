import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  finalScore: integer("final_score").notNull(),
  dateCreated: text("date_created").notNull(),
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
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Future feature — not yet exposed via API
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addresseeId: integer("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'blocked'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const gameSnapshotSchema = z.object({
  correctAnswers: z.number().int().min(0),
  wrongAnswers: z.number().int().min(0),
  totalTime: z.number().min(0),
  finalScore: z.number().min(0),
  maxStreak: z.number().int().min(0),
  totalQuestionsAnswered: z.number().int().min(0),
  categoryPerformance: z.record(z.object({
    correct: z.number().int().min(0),
    wrong: z.number().int().min(0),
  })),
});

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

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

export type GameSnapshot = z.infer<typeof gameSnapshotSchema>;
