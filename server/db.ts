// server/db.ts (Drizzle Bağlantısı)

import 'dotenv/config'; // .env dosyasını yükler
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// DATABASE_URL değişkenini kullanır ve Neon'a bağlanır
const sql = neon(process.env.DATABASE_URL!);

// Drizzle ORM'i başlatır
export const db = drizzle(sql);