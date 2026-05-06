import {
  users,
  type User,
  type InsertUser,
  emailVerifications,
  type EmailVerification,
  type InsertEmailVerification,
  questions,
  type Question,
  type InsertQuestion,
  games,
  type Game,
  type InsertGame,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;

  // Email verification
  createEmailVerification(data: InsertEmailVerification): Promise<EmailVerification>;
  getEmailVerification(userId: number): Promise<EmailVerification | undefined>;
  deleteEmailVerification(userId: number): Promise<void>;
  verifyUserEmail(userId: number): Promise<void>;

  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsBySection(section: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // Games / scores
  saveGame(game: InsertGame): Promise<Game>;
  getTopScores(difficulty?: string, section?: string): Promise<Game[]>;
}

export class PostgresStorage implements IStorage {
  // --- Users ---

  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).limit(1).then(r => r[0]);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).limit(1).then(r => r[0]);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0]);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().then(r => r[0]);
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    return db.update(users).set(data).where(eq(users.id, id)).returning().then(r => r[0]);
  }

  // --- Email verification ---

  async createEmailVerification(data: InsertEmailVerification): Promise<EmailVerification> {
    // Replace any existing record for this user
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, data.userId));
    return db.insert(emailVerifications).values(data).returning().then(r => r[0]);
  }

  async getEmailVerification(userId: number): Promise<EmailVerification | undefined> {
    return db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, userId))
      .limit(1)
      .then(r => r[0]);
  }

  async deleteEmailVerification(userId: number): Promise<void> {
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));
  }

  async verifyUserEmail(userId: number): Promise<void> {
    await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, userId));
  }

  // --- Questions ---

  async getQuestions(): Promise<Question[]> {
    return db.select().from(questions);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return db.select().from(questions).where(eq(questions.id, id)).limit(1).then(r => r[0]);
  }

  async getQuestionsBySection(section: string): Promise<Question[]> {
    const normalized = section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();
    return db.select().from(questions).where(eq(questions.section, normalized));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    return db.insert(questions).values(insertQuestion).returning().then(r => r[0]);
  }

  // --- Games / scores ---

  async saveGame(insertGame: InsertGame): Promise<Game> {
    return db.insert(games).values(insertGame).returning().then(r => r[0]);
  }

  async getTopScores(difficulty?: string, section?: string): Promise<Game[]> {
    let query = db.select().from(games).$dynamic();
    if (difficulty) query = query.where(eq(games.difficulty, difficulty));
    if (section) query = query.where(eq(games.section, section));
    return query.orderBy(desc(games.finalScore)).limit(10);
  }
}

export const storage = new PostgresStorage();
