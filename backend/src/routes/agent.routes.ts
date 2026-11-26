import "dotenv/config";
import { Router } from "express";
import type { Request, Response } from "express";
import { runAgent } from "../services/agent.service.js";
import {cleanupExpiredSessions,getConversation,
  saveConversation,
  deleteConversation,} from "../services/conversation.service.js";

const router = Router();

router.post("/chat", async (req: Request, res: Response) => {
  try {
    // Clean up expired sessions before processing the request
      cleanupExpiredSessions();
    const { message, sessionId } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

      if (typeof sessionId !== "string" || !sessionId.trim()) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
    }
 
// Retrieve the existing conversation session
const existingSession = getConversation(sessionId);
const previousResponseId = existingSession?.responseId;
// Check whether the session has expired

// Execute AI agent service
const { responseId, result } = await runAgent(
  message.trim(),
  previousResponseId
);

// Save latest conversation response
saveConversation(sessionId, responseId);

return res.status(200).json({
  success: true,
  sessionId: sessionId,
  reply: result.reply,
  lead: {
    customer_name: result.customer_name,
    budget_inr: result.budget_inr,
    location: result.location,
    property_type: result.property_type,
    lead_status: result.lead_status,
    next_question: result.next_question,
  },
});
  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(502).json({
      success: false,
      error: "AI service temporarily unavailable",
    });
  }
});


router.delete(
  "/session/:sessionId",
  (req: Request<{ sessionId: string }>, res: Response) => {
    const sessionId = req.params.sessionId;

    if (!sessionId.trim()) {
      return res.status(400).json({
        success: false,
        error: "Valid session ID is required",
      });
    }

    const sessionDeleted = deleteConversation(sessionId);
    if (!sessionDeleted) {
       return res.status(404).json({
    success: false,
    message: "Session not found",
  });
}

    // No additional deletion needed here.
// deleteConversation(sessionId) already deletes the session.

    return res.status(200).json({
      success: true,
      message: "Conversation reset successfully",
      sessionId,
    });
  }
);


export default router;
