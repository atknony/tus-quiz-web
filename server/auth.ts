import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends Omit<import("@shared/schema").User, never> {}
  }
}

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (emailOrUsername, password, done) => {
      try {
        let user = await storage.getUserByEmail(emailOrUsername);
        if (!user) {
          user = await storage.getUserByUsername(emailOrUsername);
        }
        if (!user) {
          return done(null, false, { message: "Geçersiz e-posta veya şifre." });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Geçersiz e-posta veya şifre." });
        }
        if (!user.isEmailVerified) {
          return done(null, false, { message: "Lütfen önce e-posta adresinizi doğrulayın." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});
