import "dotenv/config";
import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.error("Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD in .env before running this script.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ username, password: passwordHash, role: "admin", isEmailVerified: true })
      .where(eq(users.email, email));
    console.log(`Admin account updated: ${email}`);
  } else {
    await db.insert(users).values({
      username,
      email,
      password: passwordHash,
      dateOfBirth: "1990-01-01",
      university: "Admin",
      role: "admin",
      isEmailVerified: true,
    });
    console.log(`Admin account created: ${email}`);
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
