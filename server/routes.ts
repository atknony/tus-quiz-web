import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get questions
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // API endpoint to save game result
  app.post("/api/games", async (req, res) => {
    try {
      const gameData = req.body;
      const game = await storage.saveGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error saving game:", error);
      res.status(500).json({ message: "Failed to save game" });
    }
  });

  // API endpoint to get top scores
  app.get("/api/games/top", async (req, res) => {
    try {
      const { difficulty } = req.query;
      const topScores = await storage.getTopScores(difficulty as string);
      res.json(topScores);
    } catch (error) {
      console.error("Error fetching top scores:", error);
      res.status(500).json({ message: "Failed to fetch top scores" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
