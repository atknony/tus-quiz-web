import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { gameSnapshotSchema } from "@shared/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Çok fazla deneme. Lütfen 15 dakika sonra tekrar deneyin." },
});

const gamesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Çok fazla istek." },
});

const friendsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Çok fazla istek." },
});

// --- Validation schemas ---

const registerBodySchema = z
  .object({
    username: z
      .string()
      .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
      .max(30, "Kullanıcı adı en fazla 30 karakter olabilir.")
      .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir."),
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır.")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Şifre en az bir özel karakter içermelidir."),
    confirmPassword: z.string(),
    dateOfBirth: z.string().min(1, "Doğum tarihi zorunludur."),
    university: z.string().min(1, "Üniversite seçiniz."),
    captchaToken: z.string().min(1, "Lütfen robot olmadığınızı doğrulayın."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Şifreler eşleşmiyor.",
  });

const loginBodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const verifyEmailBodySchema = z.object({
  userId: z.number(),
  otp: z.string().length(6),
});

const resendVerificationBodySchema = z.object({
  email: z.string().email(),
});

const startGameBodySchema = z.object({
  mode: z.literal("competitive"),
  section: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "expert"]),
});

// --- Helpers ---

function toSafeUser(user: User) {
  const { password: _, ...safe } = user;
  return safe;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

async function sendOtpEmail(email: string, username: string, otp: string): Promise<void> {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "TUS Quiz — E-posta Doğrulama Kodunuz",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Merhaba ${username},</h2>
        <p>TUS Quiz hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center;
                    padding: 24px; background: #f4f4f5; border-radius: 8px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">Bu kod <strong>15 dakika</strong> içinde geçerliliğini yitirecektir.</p>
        <p style="color: #6b7280; font-size: 14px;">Bu e-postayı siz talep etmediyseniz güvenle yoksayabilirsiniz.</p>
      </div>
    `,
  });
}

// --- Route registration ---

export async function registerRoutes(app: Express): Promise<Server> {
  // Existing quiz routes
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:section", async (req, res) => {
    try {
      const { section } = req.params;
      const category = typeof req.query.category === 'string' && req.query.category ? req.query.category : undefined;
      const questions = category
        ? await storage.getQuestionsBySectionAndCategory(section, category)
        : await storage.getQuestionsBySection(section);
      res.json(questions);
    } catch {
      res.status(500).json({ message: `Failed to fetch ${req.params.section} questions` });
    }
  });

  // --- Competitive games API ---

  app.post("/api/games", gamesLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const parsed = startGameBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek." });
    const { section, difficulty } = parsed.data;
    const user = req.user as User;
    try {
      const game = await storage.createGame({
        userId: user.id,
        mode: "competitive",
        section,
        difficulty,
        status: "abandoned",
        correctAnswers: 0,
        wrongAnswers: 0,
        totalTime: 0,
        finalScore: 0,
        dateCreated: new Date().toISOString().split("T")[0],
      });
      return res.status(201).json({ gameId: game.id });
    } catch {
      return res.status(500).json({ message: "Oyun başlatılamadı." });
    }
  });

  app.patch("/api/games/:id/complete", gamesLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Geçersiz oyun ID." });
    const parsed = gameSnapshotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz veri." });
    const user = req.user as User;
    try {
      const game = await storage.completeGame(id, user.id, parsed.data);
      if (!game) return res.status(404).json({ message: "Oyun bulunamadı." });
      return res.json(game);
    } catch {
      return res.status(500).json({ message: "Oyun tamamlanamadı." });
    }
  });

  app.patch("/api/games/:id", gamesLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Geçersiz oyun ID." });
    const parsed = gameSnapshotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz veri." });
    const user = req.user as User;
    try {
      const game = await storage.updateGame(id, user.id, parsed.data);
      if (!game) return res.status(404).json({ message: "Oyun bulunamadı." });
      return res.json(game);
    } catch {
      return res.status(500).json({ message: "Anlık kayıt başarısız." });
    }
  });

  app.get("/api/games/me", gamesLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const user = req.user as User;
    const rawLimit = parseInt(req.query.limit as string, 10);
    const limit = isNaN(rawLimit) ? 100 : Math.min(rawLimit, 100);
    try {
      const userGames = await storage.getGamesByUserId(user.id, limit);
      return res.json(userGames);
    } catch {
      return res.status(500).json({ message: "Oyun geçmişi alınamadı." });
    }
  });

  app.get("/api/users/:id/profile", gamesLimiter, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Geçersiz kullanıcı ID." });
    try {
      const target = await storage.getUser(id);
      if (!target) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
      const stats = await storage.getUserStats(id);
      const isSelf = req.isAuthenticated() && (req.user as User).id === id;

      const base = {
        id: target.id,
        username: target.username,
        university: target.university,
        createdAt: target.createdAt,
        stats,
      };
      const payload = isSelf
        ? { ...base, email: target.email, dateOfBirth: target.dateOfBirth }
        : base;
      return res.json(payload);
    } catch {
      return res.status(500).json({ message: "Profil yüklenemedi." });
    }
  });

  app.get("/api/users/:id/games", gamesLimiter, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Geçersiz kullanıcı ID." });

    const rawLimit = parseInt(req.query.limit as string, 10);
    const limit = isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 50);
    const rawOffset = parseInt(req.query.offset as string, 10);
    const offset = isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);

    try {
      // Fetch limit + 1 so we can tell if more rows exist beyond this page.
      const fetched = await storage.getCompletedGamesByUserId(id, { limit: limit + 1, offset });
      const hasMore = fetched.length > limit;
      const page = hasMore ? fetched.slice(0, limit) : fetched;
      return res.json({ games: page, hasMore });
    } catch {
      return res.status(500).json({ message: "Oyun geçmişi alınamadı." });
    }
  });

  // --- Friends API ---

  app.get("/api/friends/search", friendsLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const q = (req.query.q as string) ?? "";
    if (q.length < 2) return res.status(400).json({ message: "En az 2 karakter giriniz." });
    const me = (req.user as User).id;
    try {
      const results = await storage.searchUsers(q, me);
      return res.json(results);
    } catch {
      return res.status(500).json({ message: "Arama başarısız." });
    }
  });

  app.get("/api/friends", friendsLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const me = (req.user as User).id;
    try {
      const friends = await storage.getAcceptedFriends(me);
      return res.json(friends);
    } catch {
      return res.status(500).json({ message: "Arkadaş listesi alınamadı." });
    }
  });

  app.get("/api/friends/requests", friendsLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const me = (req.user as User).id;
    try {
      const requests = await storage.getPendingRequestsForUser(me);
      return res.json(requests);
    } catch {
      return res.status(500).json({ message: "İstekler alınamadı." });
    }
  });

  app.post("/api/friends/request", friendsLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const me = (req.user as User).id;
    const addresseeId = Number(req.body?.addresseeId);
    if (!Number.isInteger(addresseeId) || addresseeId <= 0) return res.status(400).json({ message: "Geçersiz kullanıcı." });
    if (addresseeId === me) return res.status(400).json({ message: "Kendinize istek gönderemezsiniz." });
    try {
      const friendship = await storage.sendFriendRequest(me, addresseeId);
      return res.status(201).json(friendship);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "Friendship already exists") return res.status(409).json({ message: "Bu kullanıcıyla zaten bir ilişkiniz var." });
      return res.status(500).json({ message: "İstek gönderilemedi." });
    }
  });

  app.patch("/api/friends/requests/:id/accept", friendsLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Geçersiz istek ID." });
    const me = (req.user as User).id;
    try {
      const friendship = await storage.acceptFriendRequest(id, me);
      if (!friendship) return res.status(403).json({ message: "Bu isteği kabul edemezsiniz." });
      return res.json(friendship);
    } catch {
      return res.status(500).json({ message: "İstek kabul edilemedi." });
    }
  });

  app.delete("/api/friends/requests/:id", friendsLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Geçersiz istek ID." });
    const me = (req.user as User).id;
    try {
      await storage.deleteFriendship(id, me);
      return res.json({ message: "İstek silindi." });
    } catch {
      return res.status(500).json({ message: "İstek silinemedi." });
    }
  });

  app.delete("/api/friends/:friendId", friendsLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const friendId = parseInt(req.params.friendId, 10);
    if (isNaN(friendId)) return res.status(400).json({ message: "Geçersiz kullanıcı ID." });
    const me = (req.user as User).id;
    try {
      const row = await storage.getFriendshipBetween(me, friendId);
      if (!row) return res.status(404).json({ message: "Arkadaşlık bulunamadı." });
      await storage.deleteFriendship(row.id, me);
      return res.json({ message: "Arkadaş kaldırıldı." });
    } catch {
      return res.status(500).json({ message: "Arkadaş kaldırılamadı." });
    }
  });

  app.get("/api/leaderboard", friendsLimiter, async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const me = (req.user as User).id;
    try {
      const entries = await storage.getFriendsLeaderboard(me);
      return res.json(entries.map(e => ({ ...e, isMe: e.userId === me })));
    } catch {
      return res.status(500).json({ message: "Sıralama alınamadı." });
    }
  });

  app.get("/api/games/leaderboard", async (req: Request, res: Response) => {
    const { difficulty, section } = req.query;
    const rawLimit = parseInt(req.query.limit as string, 10);
    const limit = isNaN(rawLimit) ? 50 : Math.min(rawLimit, 50);
    try {
      const board = await storage.getLeaderboard({
        difficulty: difficulty as string | undefined,
        section: section as string | undefined,
        limit,
      });
      return res.json(board);
    } catch {
      return res.status(500).json({ message: "Liderlik tablosu alınamadı." });
    }
  });

  // Auth routes (all rate-limited)
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    const parsed = registerBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Geçersiz istek.";
      return res.status(400).json({ message: msg });
    }

    const { username, email, password, dateOfBirth, university, captchaToken } = parsed.data;

    const captchaOk = await verifyTurnstile(captchaToken);
    if (!captchaOk) {
      return res.status(400).json({ message: "CAPTCHA doğrulaması başarısız." });
    }

    const [existingByUsername, existingByEmail] = await Promise.all([
      storage.getUserByUsername(username),
      storage.getUserByEmail(email),
    ]);
    if (existingByUsername) return res.status(409).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
    if (existingByEmail) return res.status(409).json({ message: "Bu e-posta adresi zaten kayıtlı." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await storage.createUser({
      username,
      email,
      password: passwordHash,
      dateOfBirth,
      university,
    });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await storage.createEmailVerification({ userId: user.id, otpHash, expiresAt });
    await sendOtpEmail(email, username, otp);

    return res.status(201).json({ userId: user.id, message: "Doğrulama kodu e-posta adresinize gönderildi." });
  });

  app.post("/api/auth/verify-email", authLimiter, async (req: Request, res: Response) => {
    const parsed = verifyEmailBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek." });

    const { userId, otp } = parsed.data;

    const record = await storage.getEmailVerification(userId);
    if (!record) return res.status(400).json({ message: "Doğrulama kaydı bulunamadı." });
    if (new Date() > record.expiresAt) {
      await storage.deleteEmailVerification(userId);
      return res.status(400).json({ message: "Kodun süresi dolmuş. Lütfen yeni kod isteyin." });
    }

    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) return res.status(400).json({ message: "Hatalı kod. Lütfen tekrar deneyin." });

    await storage.verifyUserEmail(userId);
    await storage.deleteEmailVerification(userId);

    const user = await storage.getUser(userId);
    req.login(user!, (err) => {
      if (err) return res.status(500).json({ message: "Oturum başlatılamadı." });
      return res.json(toSafeUser(user!));
    });
  });

  app.post("/api/auth/login", authLimiter, (req: Request, res: Response, next) => {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek." });

    passport.authenticate("local", (err: any, user: User | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message ?? "Giriş başarısız." });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json(toSafeUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => res.json({ message: "Çıkış yapıldı." }));
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.json(null);
    return res.json(toSafeUser(req.user as User));
  });

  app.post("/api/auth/resend-verification", authLimiter, async (req: Request, res: Response) => {
    const parsed = resendVerificationBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz e-posta." });

    const user = await storage.getUserByEmail(parsed.data.email);
    // Always return 200 to avoid user enumeration
    if (!user || user.isEmailVerified) return res.json({ message: "Doğrulama kodu gönderildi." });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await storage.createEmailVerification({ userId: user.id, otpHash, expiresAt });
    await sendOtpEmail(user.email, user.username, otp);

    return res.json({ message: "Doğrulama kodu gönderildi." });
  });

  const httpServer = createServer(app);
  return httpServer;
}
