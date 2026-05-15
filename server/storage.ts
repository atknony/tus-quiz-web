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
  type QuestionTiming,
  friendships,
  type Friendship,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ne, ilike, count, sum, max, inArray } from "drizzle-orm";
import { deriveGameState, type DerivedGameState } from "./gameState";
import { computeMatchScore, computeRating } from "./scoring";

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  selectedAnswer: string | null;
  questionIndex: number;
  // Server-authoritative derived state — client mirrors these into GameState.
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number;
  score: number;
  maxStreak: number;
  currentStreak: number;
  categoryPerformance: Record<string, { correct: number; wrong: number }>;
  gameOver: boolean;
}

export class GameNotFoundError extends Error {}
export class GameAlreadyCompletedError extends Error {}
export class InvalidQuestionIndexError extends Error {}
export class QuestionNotServedError extends Error {}

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
  rating: number;
  totalGames: number;
  accuracyRate: number;
  maxStreakEver: number;
}

export interface CategoryBreakdownEntry {
  correct: number;
  total: number;
  accuracy: number;
}

export interface UserStats {
  totalGames: number;
  totalCorrect: number;
  totalWrong: number;
  accuracyRate: number;
  maxStreakEver: number;
  strongestCategory: string | null;
  weakestCategory: string | null;
  categoryBreakdown: Record<string, CategoryBreakdownEntry>;
  categoryBreakdownRecent: Record<string, CategoryBreakdownEntry>;
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
  getQuestionsForGame(section: string, category: string | null): Promise<number[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;

  // Games / scores
  saveGame(game: InsertGame): Promise<Game>;
  createGame(game: InsertGame): Promise<Game>;
  completeGame(id: number, userId: number): Promise<Game | undefined>;
  getGameById(id: number): Promise<Game | undefined>;
  recordQuestionServed(gameId: number, userId: number, index: number, timing: QuestionTiming, existingTimings: QuestionTiming[]): Promise<void>;
  submitAnswer(gameId: number, userId: number, questionIndex: number, selectedAnswer: string | null): Promise<AnswerResult>;
  getGamesByUserId(userId: number, limit?: number): Promise<Game[]>;
  getCompletedGamesByUserId(userId: number, opts?: { limit?: number; offset?: number }): Promise<Game[]>;
  getUserStats(userId: number): Promise<UserStats>;
  enforceUserGameCap(userId: number): Promise<void>;

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

  async getQuestionsForGame(section: string, category: string | null): Promise<number[]> {
    const pool = category
      ? await this.getQuestionsBySectionAndCategory(section, category)
      : await this.getQuestionsBySection(section);
    // Fisher-Yates shuffle, server-side authoritative ordering.
    const ids = pool.map(q => q.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
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

  /**
   * Compute server-authoritative derived state AND match score from a game's
   * questionTimings. Fetches all referenced questions in a single batched query.
   */
  private async deriveAndScore(game: Game): Promise<{ derived: DerivedGameState; score: number }> {
    const ids = game.questionTimings
      .filter(t => t && t.answeredAt)
      .map(t => t.questionId);
    if (ids.length === 0) {
      const derived = deriveGameState(game.questionTimings, new Map(), game.difficulty);
      return { derived, score: 0 };
    }
    const rows = await db.select().from(questions).where(inArray(questions.id, ids));
    const questionsById = new Map(rows.map(q => [q.id, q]));
    const derived = deriveGameState(game.questionTimings, questionsById, game.difficulty);
    const score = computeMatchScore(game.questionTimings, questionsById, game.difficulty, derived);
    return { derived, score };
  }

  /**
   * Iter 2c: no client snapshot. Server derives final state from `questionTimings`,
   * computes the match score, and marks the game completed. Idempotent — re-completing
   * returns the existing row.
   */
  async completeGame(id: number, userId: number): Promise<Game | undefined> {
    const game = await this.getGameById(id);
    if (!game || game.userId !== userId) return undefined;
    if (game.status === "completed") return game;

    const { derived, score } = await this.deriveAndScore(game);

    return db
      .update(games)
      .set({
        correctAnswers: derived.correctAnswers,
        wrongAnswers: derived.wrongAnswers,
        totalTime: derived.totalTime,
        score,
        maxStreak: derived.maxStreak,
        totalQuestionsAnswered: derived.totalQuestionsAnswered,
        accuracyRate: derived.accuracyRate,
        avgTimePerQuestion: derived.avgTimePerQuestion,
        categoryPerformance: derived.categoryPerformance,
        status: "completed",
        completedAt: new Date(),
      })
      .where(and(eq(games.id, id), eq(games.userId, userId)))
      .returning()
      .then(r => r[0]);
  }

  async submitAnswer(
    gameId: number,
    userId: number,
    questionIndex: number,
    selectedAnswer: string | null,
  ): Promise<AnswerResult> {
    const game = await this.getGameById(gameId);
    if (!game || game.userId !== userId) throw new GameNotFoundError();
    if (game.status === "completed") throw new GameAlreadyCompletedError();
    if (questionIndex !== game.currentQuestionIndex) throw new InvalidQuestionIndexError();

    const timing = game.questionTimings[questionIndex];
    if (!timing || !timing.servedAt) throw new QuestionNotServedError();

    // Idempotency: same index re-posted → return cached result without mutating.
    const alreadyAnswered = timing.answeredAt !== null;
    const effectiveSelected = alreadyAnswered ? timing.selectedAnswer : selectedAnswer;

    let updatedTimings = game.questionTimings;
    if (!alreadyAnswered) {
      const answeredAt = new Date().toISOString();
      updatedTimings = [...game.questionTimings];
      updatedTimings[questionIndex] = { ...timing, answeredAt, selectedAnswer };
    }

    // Fetch every question this game references (small batch — Fisher-Yates pool size).
    const allIds = game.chosenQuestionIds;
    const rows = await db.select().from(questions).where(inArray(questions.id, allIds));
    const questionsById = new Map(rows.map(q => [q.id, q]));

    const currentQuestion = questionsById.get(timing.questionId);
    if (!currentQuestion) throw new QuestionNotServedError();

    const derived = deriveGameState(updatedTimings, questionsById, game.difficulty);
    const score = computeMatchScore(updatedTimings, questionsById, game.difficulty, derived);

    const isCorrect = effectiveSelected !== null
      && effectiveSelected === currentQuestion.correctAnswer;

    // Persist on first call; idempotent retries return cached values without re-writing.
    if (!alreadyAnswered) {
      await db
        .update(games)
        .set({
          questionTimings: updatedTimings,
          correctAnswers: derived.correctAnswers,
          wrongAnswers: derived.wrongAnswers,
          totalTime: derived.totalTime,
          score,
          maxStreak: derived.maxStreak,
          totalQuestionsAnswered: derived.totalQuestionsAnswered,
          accuracyRate: derived.accuracyRate,
          avgTimePerQuestion: derived.avgTimePerQuestion,
          categoryPerformance: derived.categoryPerformance,
        })
        .where(and(eq(games.id, gameId), eq(games.userId, userId)));
    }

    return {
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      selectedAnswer: effectiveSelected,
      questionIndex,
      correctAnswers: derived.correctAnswers,
      wrongAnswers: derived.wrongAnswers,
      totalTime: derived.totalTime,
      score,
      maxStreak: derived.maxStreak,
      currentStreak: derived.currentStreak,
      categoryPerformance: derived.categoryPerformance,
      gameOver: derived.gameOver,
    };
  }

  async getGameById(id: number): Promise<Game | undefined> {
    return db.select().from(games).where(eq(games.id, id)).limit(1).then(r => r[0]);
  }

  async recordQuestionServed(
    gameId: number,
    userId: number,
    index: number,
    timing: QuestionTiming,
    existingTimings: QuestionTiming[],
  ): Promise<void> {
    const updated = [...existingTimings];
    updated[index] = timing;
    await db
      .update(games)
      .set({ questionTimings: updated, currentQuestionIndex: index })
      .where(and(eq(games.id, gameId), eq(games.userId, userId)));
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
    const categoryBreakdown: Record<string, CategoryBreakdownEntry> = {};
    const categoryBreakdownRecent: Record<string, CategoryBreakdownEntry> = {};

    if (totalGames > 0) {
      // Fetch every completed game's categoryPerformance, newest first, in one pass.
      const rows = await db.select({
        categoryPerformance: games.categoryPerformance,
        startedAt: games.startedAt,
      })
        .from(games)
        .where(and(eq(games.userId, userId), eq(games.status, "completed")))
        .orderBy(desc(games.startedAt));

      const mergedAll: Record<string, { correct: number; wrong: number }> = {};
      const mergedRecent: Record<string, { correct: number; wrong: number }> = {};
      const RECENT_WINDOW = 10;

      rows.forEach((r, i) => {
        const perf = r.categoryPerformance ?? {};
        for (const [cat, stats] of Object.entries(perf)) {
          if (!mergedAll[cat]) mergedAll[cat] = { correct: 0, wrong: 0 };
          mergedAll[cat].correct += stats.correct;
          mergedAll[cat].wrong += stats.wrong;
          if (i < RECENT_WINDOW) {
            if (!mergedRecent[cat]) mergedRecent[cat] = { correct: 0, wrong: 0 };
            mergedRecent[cat].correct += stats.correct;
            mergedRecent[cat].wrong += stats.wrong;
          }
        }
      });

      for (const [cat, s] of Object.entries(mergedAll)) {
        const total = s.correct + s.wrong;
        categoryBreakdown[cat] = {
          correct: s.correct,
          total,
          accuracy: total > 0 ? (s.correct / total) * 100 : 0,
        };
      }
      for (const [cat, s] of Object.entries(mergedRecent)) {
        const total = s.correct + s.wrong;
        categoryBreakdownRecent[cat] = {
          correct: s.correct,
          total,
          accuracy: total > 0 ? (s.correct / total) * 100 : 0,
        };
      }

      // Require minimum 3 answers to qualify as strongest/weakest,
      // so one lucky/unlucky guess doesn't dominate.
      const ranked = Object.entries(categoryBreakdown)
        .filter(([, c]) => c.total >= 3)
        .sort((a, b) => b[1].accuracy - a[1].accuracy);

      if (ranked.length > 0) {
        strongestCategory = ranked[0][0];
        weakestCategory = ranked[ranked.length - 1][0];
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
      categoryBreakdown,
      categoryBreakdownRecent,
    };
  }

  async enforceUserGameCap(userId: number): Promise<void> {
    const [row] = await db.select({ count: count() }).from(games).where(eq(games.userId, userId));
    const current = row?.count ?? 0;
    if (current < USER_GAME_CAP) return;

    const toDelete = current - (USER_GAME_CAP - 1);

    // Evict abandoned drafts first — they're ephemeral; completed games hold real history.
    const abandoned = await db.select({ id: games.id })
      .from(games)
      .where(and(eq(games.userId, userId), eq(games.status, "abandoned")))
      .orderBy(asc(games.startedAt))
      .limit(toDelete);

    const victims: number[] = abandoned.map(r => r.id);

    // Only fall back to oldest completed games if abandoned drafts are exhausted.
    if (victims.length < toDelete) {
      const remaining = toDelete - victims.length;
      const completedRows = await db.select({ id: games.id })
        .from(games)
        .where(and(eq(games.userId, userId), eq(games.status, "completed")))
        .orderBy(asc(games.startedAt))
        .limit(remaining);
      victims.push(...completedRows.map(r => r.id));
    }

    if (victims.length > 0) {
      await db.delete(games).where(inArray(games.id, victims));
    }
  }

  /**
   * Iter 5: rolling-window weighted rating across each participant's completed games.
   * Lifetime stats (totalGames/accuracyRate/maxStreakEver) come from ALL completed games;
   * the rating itself uses last 30 with exponential decay and difficulty multipliers.
   */
  async getFriendsLeaderboard(userId: number): Promise<LeaderboardEntry[]> {
    const friends = await this.getAcceptedFriends(userId);
    const participantIds = [userId, ...friends.map(f => f.id)];

    const userRows = await db.select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.id, participantIds));

    const allGames = await db.select({
      userId: games.userId,
      score: games.score,
      difficulty: games.difficulty,
      startedAt: games.startedAt,
      correctAnswers: games.correctAnswers,
      wrongAnswers: games.wrongAnswers,
      maxStreak: games.maxStreak,
    })
      .from(games)
      .where(and(inArray(games.userId, participantIds), eq(games.status, "completed")));

    const byUser = new Map<number, typeof allGames>();
    for (const g of allGames) {
      if (g.userId === null) continue;
      if (!byUser.has(g.userId)) byUser.set(g.userId, []);
      byUser.get(g.userId)!.push(g);
    }

    const entries: LeaderboardEntry[] = userRows.map(u => {
      const userGames = byUser.get(u.id) ?? [];
      const totalGames = userGames.length;
      const totalCorrect = userGames.reduce((s, g) => s + g.correctAnswers, 0);
      const totalWrong = userGames.reduce((s, g) => s + g.wrongAnswers, 0);
      const totalAnswered = totalCorrect + totalWrong;
      const accuracyRate = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
      const maxStreakEver = userGames.reduce((m, g) => Math.max(m, g.maxStreak), 0);
      const rating = computeRating(userGames);
      return { userId: u.id, username: u.username, rating, totalGames, accuracyRate, maxStreakEver };
    });

    return entries.sort((a, b) => b.rating - a.rating);
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
