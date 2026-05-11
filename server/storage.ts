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
  type GameSnapshot,
  friendships,
  type Friendship,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ne, ilike, count, sum, max, inArray } from "drizzle-orm";

export interface FriendshipWithUser extends Friendship {
  otherUser: { id: number; username: string; university: string };
}

export interface FriendWithProfile {
  friendshipId: number;
  id: number;
  username: string;
  university: string;
}

export interface UserPublic {
  id: number;
  username: string;
  university: string;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  masteryScore: number;
  totalGames: number;
  accuracyRate: number;
  maxStreakEver: number;
}

export interface UserStats {
  totalGames: number;
  totalCorrect: number;
  totalWrong: number;
  accuracyRate: number;
  maxStreakEver: number;
  strongestCategory: string | null;
  weakestCategory: string | null;
}

const USER_GAME_CAP = 100;

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
  getQuestionsBySectionAndCategory(section: string, category: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // Games / scores
  saveGame(game: InsertGame): Promise<Game>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, userId: number, data: GameSnapshot): Promise<Game | undefined>;
  completeGame(id: number, userId: number, data: GameSnapshot): Promise<Game | undefined>;
  getGameById(id: number): Promise<Game | undefined>;
  getGamesByUserId(userId: number, limit?: number): Promise<Game[]>;
  getCompletedGamesByUserId(userId: number, opts?: { limit?: number; offset?: number }): Promise<Game[]>;
  getUserStats(userId: number): Promise<UserStats>;
  enforceUserGameCap(userId: number): Promise<void>;
  getLeaderboard(opts?: { difficulty?: string; section?: string; limit?: number }): Promise<Array<Game & { username: string }>>;
  getTopScores(difficulty?: string, section?: string): Promise<Game[]>;

  getFriendsLeaderboard(userId: number): Promise<LeaderboardEntry[]>;

  // Friendships
  sendFriendRequest(requesterId: number, addresseeId: number): Promise<Friendship>;
  getFriendshipBetween(userId1: number, userId2: number): Promise<Friendship | undefined>;
  getFriendRequestById(id: number): Promise<Friendship | undefined>;
  acceptFriendRequest(id: number, addresseeId: number): Promise<Friendship | undefined>;
  deleteFriendship(id: number, userId: number): Promise<void>;
  getPendingRequestsForUser(userId: number): Promise<{ sent: FriendshipWithUser[]; received: FriendshipWithUser[] }>;
  getAcceptedFriends(userId: number): Promise<FriendWithProfile[]>;
  searchUsers(query: string, excludeUserId: number, limit?: number): Promise<UserPublic[]>;
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

  async getQuestionsBySectionAndCategory(section: string, category: string): Promise<Question[]> {
    const normalized = section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();
    return db.select().from(questions).where(
      and(eq(questions.section, normalized), eq(questions.category, category))
    );
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    return db.insert(questions).values(insertQuestion).returning().then(r => r[0]);
  }

  // --- Games / scores ---

  async saveGame(insertGame: InsertGame): Promise<Game> {
    return this.createGame(insertGame);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    if (insertGame.userId != null) {
      await this.enforceUserGameCap(insertGame.userId);
    }
    return db.insert(games).values(insertGame).returning().then(r => r[0]);
  }

  async updateGame(id: number, userId: number, data: GameSnapshot): Promise<Game | undefined> {
    const { correctAnswers, wrongAnswers, totalTime, finalScore, maxStreak, totalQuestionsAnswered, categoryPerformance } = data;
    const accuracyRate = totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0;
    const avgTimePerQuestion = totalQuestionsAnswered > 0 ? totalTime / totalQuestionsAnswered : 0;
    return db
      .update(games)
      .set({ correctAnswers, wrongAnswers, totalTime, finalScore, maxStreak, totalQuestionsAnswered, accuracyRate, avgTimePerQuestion, categoryPerformance })
      .where(and(eq(games.id, id), eq(games.userId, userId)))
      .returning()
      .then(r => r[0]);
  }

  async completeGame(id: number, userId: number, data: GameSnapshot): Promise<Game | undefined> {
    const { correctAnswers, wrongAnswers, totalTime, finalScore, maxStreak, totalQuestionsAnswered, categoryPerformance } = data;
    const accuracyRate = totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0;
    const avgTimePerQuestion = totalQuestionsAnswered > 0 ? totalTime / totalQuestionsAnswered : 0;
    return db
      .update(games)
      .set({ correctAnswers, wrongAnswers, totalTime, finalScore, maxStreak, totalQuestionsAnswered, accuracyRate, avgTimePerQuestion, categoryPerformance, status: "completed", completedAt: new Date() })
      .where(and(eq(games.id, id), eq(games.userId, userId)))
      .returning()
      .then(r => r[0]);
  }

  async getGameById(id: number): Promise<Game | undefined> {
    return db.select().from(games).where(eq(games.id, id)).limit(1).then(r => r[0]);
  }

  async getGamesByUserId(userId: number, limit = 100): Promise<Game[]> {
    return db.select().from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.startedAt))
      .limit(limit);
  }

  async getCompletedGamesByUserId(userId: number, opts: { limit?: number; offset?: number } = {}): Promise<Game[]> {
    const { limit = 20, offset = 0 } = opts;
    return db.select().from(games)
      .where(and(eq(games.userId, userId), eq(games.status, "completed")))
      .orderBy(desc(games.startedAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const [agg] = await db.select({
      totalGames: count(),
      totalCorrect: sum(games.correctAnswers),
      totalWrong: sum(games.wrongAnswers),
      maxStreakEver: max(games.maxStreak),
    }).from(games).where(and(eq(games.userId, userId), eq(games.status, "completed")));

    const totalGames = agg?.totalGames ?? 0;
    const totalCorrect = Number(agg?.totalCorrect ?? 0);
    const totalWrong = Number(agg?.totalWrong ?? 0);
    const totalAnswered = totalCorrect + totalWrong;
    const accuracyRate = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    const maxStreakEver = Number(agg?.maxStreakEver ?? 0);

    let strongestCategory: string | null = null;
    let weakestCategory: string | null = null;

    if (totalGames > 0) {
      const rows = await db.select({ categoryPerformance: games.categoryPerformance })
        .from(games)
        .where(and(eq(games.userId, userId), eq(games.status, "completed")));

      const merged: Record<string, { correct: number; wrong: number }> = {};
      for (const r of rows) {
        const perf = r.categoryPerformance ?? {};
        for (const [cat, stats] of Object.entries(perf)) {
          if (!merged[cat]) merged[cat] = { correct: 0, wrong: 0 };
          merged[cat].correct += stats.correct;
          merged[cat].wrong += stats.wrong;
        }
      }

      // Require minimum 3 answers in a category to qualify as strongest/weakest,
      // so a single lucky/unlucky guess doesn't dominate the result.
      const ranked = Object.entries(merged)
        .map(([category, s]) => ({
          category,
          total: s.correct + s.wrong,
          accuracy: s.correct + s.wrong > 0 ? (s.correct / (s.correct + s.wrong)) * 100 : 0,
        }))
        .filter(c => c.total >= 3)
        .sort((a, b) => b.accuracy - a.accuracy);

      if (ranked.length > 0) {
        strongestCategory = ranked[0].category;
        weakestCategory = ranked[ranked.length - 1].category;
      }
    }

    return {
      totalGames,
      totalCorrect,
      totalWrong,
      accuracyRate,
      maxStreakEver,
      strongestCategory,
      weakestCategory,
    };
  }

  async enforceUserGameCap(userId: number): Promise<void> {
    const [row] = await db.select({ count: count() }).from(games).where(eq(games.userId, userId));
    const current = row?.count ?? 0;
    if (current < USER_GAME_CAP) return;

    // Delete enough oldest rows so the upcoming insert leaves the user at exactly USER_GAME_CAP.
    const toDelete = current - (USER_GAME_CAP - 1);
    const oldest = await db.select({ id: games.id })
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(asc(games.startedAt))
      .limit(toDelete);

    if (oldest.length > 0) {
      await db.delete(games).where(inArray(games.id, oldest.map(r => r.id)));
    }
  }

  async getLeaderboard(opts: { difficulty?: string; section?: string; limit?: number } = {}): Promise<Array<Game & { username: string }>> {
    const { difficulty, section, limit = 50 } = opts;
    const rows = await db
      .select({ game: games, username: users.username })
      .from(games)
      .innerJoin(users, eq(games.userId, users.id))
      .where(and(
        eq(games.status, "completed"),
        difficulty ? eq(games.difficulty, difficulty) : undefined,
        section ? eq(games.section, section) : undefined,
      ))
      .orderBy(desc(games.finalScore))
      .limit(limit);
    return rows.map(r => ({ ...r.game, username: r.username }));
  }

  async getTopScores(difficulty?: string, section?: string): Promise<Game[]> {
    let query = db.select().from(games).$dynamic();
    if (difficulty) query = query.where(eq(games.difficulty, difficulty));
    if (section) query = query.where(eq(games.section, section));
    return query.orderBy(desc(games.finalScore)).limit(10);
  }

  async getFriendsLeaderboard(userId: number): Promise<LeaderboardEntry[]> {
    const friends = await this.getAcceptedFriends(userId);
    const participantIds = [userId, ...friends.map(f => f.id)];

    const rows = await db.select({
      userId: users.id,
      username: users.username,
      totalGames: count(games.id),
      totalCorrect: sum(games.correctAnswers),
      totalWrong: sum(games.wrongAnswers),
      maxStreakEver: max(games.maxStreak),
    })
      .from(users)
      .leftJoin(games, and(eq(games.userId, users.id), eq(games.status, "completed")))
      .where(inArray(users.id, participantIds))
      .groupBy(users.id, users.username);

    return rows.map(r => {
      const totalGames = r.totalGames;
      const totalCorrect = Number(r.totalCorrect ?? 0);
      const totalWrong = Number(r.totalWrong ?? 0);
      const totalAnswered = totalCorrect + totalWrong;
      const accuracyRate = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
      const maxStreakEver = Number(r.maxStreakEver ?? 0);
      const masteryScore = Math.round((accuracyRate * Math.sqrt(totalGames)) * 10 + (maxStreakEver * 50));
      return { userId: r.userId, username: r.username, masteryScore, totalGames, accuracyRate, maxStreakEver };
    }).sort((a, b) => b.masteryScore - a.masteryScore);
  }

  // --- Friendships ---

  async sendFriendRequest(requesterId: number, addresseeId: number): Promise<Friendship> {
    const existing = await this.getFriendshipBetween(requesterId, addresseeId);
    if (existing) throw new Error("Friendship already exists");
    return db.insert(friendships).values({ requesterId, addresseeId, status: "pending" }).returning().then(r => r[0]);
  }

  async getFriendshipBetween(userId1: number, userId2: number): Promise<Friendship | undefined> {
    return db.select().from(friendships)
      .where(or(
        and(eq(friendships.requesterId, userId1), eq(friendships.addresseeId, userId2)),
        and(eq(friendships.requesterId, userId2), eq(friendships.addresseeId, userId1)),
      ))
      .limit(1)
      .then(r => r[0]);
  }

  async getFriendRequestById(id: number): Promise<Friendship | undefined> {
    return db.select().from(friendships).where(eq(friendships.id, id)).limit(1).then(r => r[0]);
  }

  async acceptFriendRequest(id: number, addresseeId: number): Promise<Friendship | undefined> {
    return db.update(friendships)
      .set({ status: "accepted" })
      .where(and(eq(friendships.id, id), eq(friendships.addresseeId, addresseeId)))
      .returning()
      .then(r => r[0]);
  }

  async deleteFriendship(id: number, userId: number): Promise<void> {
    await db.delete(friendships).where(
      and(eq(friendships.id, id), or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))),
    );
  }

  async getPendingRequestsForUser(userId: number): Promise<{ sent: FriendshipWithUser[]; received: FriendshipWithUser[] }> {
    const cols = { id: friendships.id, requesterId: friendships.requesterId, addresseeId: friendships.addresseeId, status: friendships.status, createdAt: friendships.createdAt };
    const userCols = { id: users.id, username: users.username, university: users.university };

    const [sentRows, receivedRows] = await Promise.all([
      db.select({ ...cols, otherUser: userCols })
        .from(friendships)
        .innerJoin(users, eq(users.id, friendships.addresseeId))
        .where(and(eq(friendships.requesterId, userId), eq(friendships.status, "pending"))),
      db.select({ ...cols, otherUser: userCols })
        .from(friendships)
        .innerJoin(users, eq(users.id, friendships.requesterId))
        .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending"))),
    ]);

    return { sent: sentRows, received: receivedRows };
  }

  async getAcceptedFriends(userId: number): Promise<FriendWithProfile[]> {
    const [asRequester, asAddressee] = await Promise.all([
      db.select({ friendshipId: friendships.id, id: users.id, username: users.username, university: users.university })
        .from(friendships)
        .innerJoin(users, eq(users.id, friendships.addresseeId))
        .where(and(eq(friendships.requesterId, userId), eq(friendships.status, "accepted"))),
      db.select({ friendshipId: friendships.id, id: users.id, username: users.username, university: users.university })
        .from(friendships)
        .innerJoin(users, eq(users.id, friendships.requesterId))
        .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "accepted"))),
    ]);
    return [...asRequester, ...asAddressee];
  }

  async searchUsers(query: string, excludeUserId: number, limit = 10): Promise<UserPublic[]> {
    return db.select({ id: users.id, username: users.username, university: users.university })
      .from(users)
      .where(and(ilike(users.username, `%${query}%`), ne(users.id, excludeUserId)))
      .limit(limit);
  }
}

export const storage = new PostgresStorage();
