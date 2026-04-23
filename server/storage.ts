import {
  users,
  type User,
  type InsertUser,
  questions,
  type Question,
  type InsertQuestion,
  games,
  type Game,
  type InsertGame,
} from "@shared/schema"; // <-- BU KISIM KALMALI!
import { db } from './db'; // <-- YENİ OLUŞTURDUĞUMUZ DB BAĞLANTISI
import { eq } from 'drizzle-orm'; // <-- SQL'deki WHERE komutunu kullanmak için
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// IStorage interface'i, mevcut backend kodunuzla uyumlu kalmalıdır
export interface IStorage {
    getUser(id: number): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: InsertUser): Promise<User>;
    
    getQuestions(): Promise<Question[]>;
    getQuestion(id: number): Promise<Question | undefined>;
    getQuestionsBySection(section: string): Promise<Question[]>;
    createQuestion(question: InsertQuestion): Promise<Question>;
    
    saveGame(game: InsertGame): Promise<Game>;
    getTopScores(difficulty?: string, section?: string): Promise<Game[]>;
}

// SQL/Drizzle Tabanlı Depolama Sınıfı
export class PostgresStorage implements IStorage {
    
    // --- USER (KULLANICI) METOTLARI ---
    async getUser(id: number): Promise<User | undefined> {
        // SQL: SELECT * FROM users WHERE id = [id] LIMIT 1
        return db.select().from(users).where(eq(users.id, id)).limit(1).then(res => res[0]);
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        // SQL: SELECT * FROM users WHERE username = [username] LIMIT 1
        return db.select().from(users).where(eq(users.username, username)).limit(1).then(res => res[0]);
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        // SQL: INSERT INTO users (...) VALUES (...) RETURNING *
        return db.insert(users).values(insertUser).returning().then(res => res[0]);
    }

    // --- SORU METOTLARI ---
    async getQuestions(): Promise<Question[]> {
        // SQL: SELECT * FROM questions
        return db.select().from(questions);
    }

    async getQuestion(id: number): Promise<Question | undefined> {
        // SQL: SELECT * FROM questions WHERE id = [id] LIMIT 1
        return db.select().from(questions).where(eq(questions.id, id)).limit(1).then(res => res[0]);
    }

    async getQuestionsBySection(section: string): Promise<Question[]> {
    // ESKİ HALİ: 
    // return db.select().from(questions).where(eq(questions.category, section));

    // YENİ GEÇİCİ TEST HALİ: Tüm soruları çekelim
    const normalizedSection = section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();
    return db.select().from(questions).where(eq(questions.section, normalizedSection));
    }

    async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
        // SQL: INSERT INTO questions (...) VALUES (...) RETURNING *
        return db.insert(questions).values(insertQuestion).returning().then(res => res[0]);
    }

    // --- OYUN (SKOR) METOTLARI ---
    async saveGame(insertGame: InsertGame): Promise<Game> {
        // SQL: INSERT INTO games (...) VALUES (...) RETURNING *
        return db.insert(games).values(insertGame).returning().then(res => res[0]);
    }

    async getTopScores(difficulty?: string, section?: string): Promise<Game[]> {
        // SQL: SELECT * FROM games [WHERE ...] ORDER BY finalScore ASC LIMIT 10
        let query = db.select().from(games).$dynamic(); // Dinamik sorgu başlat

        if (difficulty) {
            query = query.where(eq(games.difficulty, difficulty));
        }
        
        if (section) {
            query = query.where(eq(games.section, section));
        }
        
        // En düşük skor en iyidir, bu yüzden artan (asc) sıralama yapıyoruz.
        return query.orderBy(desc(games.finalScore)).limit(10);
    }
}

// Export the new storage instance
export const storage = new PostgresStorage();
