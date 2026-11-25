import "dotenv/config";
import { Router } from "express";
import type { Request, Response } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      input: message.trim(),
    });

    return res.status(200).json({
      success: true,
      reply: response.output_text,
    });

  } catch (error) {
    console.error("OpenAI error:", error);

    return res.status(502).json({
      success: false,
      error: "AI service temporarily unavailable",
    });
  }
});

export default router;
