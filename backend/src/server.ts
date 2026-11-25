import express from "express";
import type { Request, Response } from "express";
import agentRoutes from "./routes/agent.routes.js";

const app = express();

const PORT = 3000;

// Middleware
app.use(express.json());

// First API route
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to AI Automation Platform!");
});

// Health check API
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "AI Automation Server is running"
  });
});
app.use("/api/agent", agentRoutes);
// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
