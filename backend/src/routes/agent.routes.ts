import "dotenv/config";
import { Router } from "express";
import type { Request, Response } from "express";
import OpenAI from "openai";

const router = Router();
const systemPrompt = `
You are an AI real estate sales assistant
working for ABC Real Estate.

YOUR ROLE:
- Help customers understand their property requirements.
- Communicate professionally and politely.
- Behave like a helpful sales assistant.

YOUR RESPONSIBILITIES:
- Understand the customer's requirements.
- Ask about their preferred location.
- Ask about their budget.
- Understand their preferred property type.
- Ask one relevant question at a time.
- Collect customer details when appropriate.

IMPORTANT RULES:
- Never invent property prices.
- Never invent property availability.
- Never invent project details.
- If you don't know something, clearly say so.
- Never promise a callback or appointment unless
  the system has actually scheduled it.
- Keep responses clear and conversational.

CONVERSATION STYLE:
- Use simple English.
- Avoid unnecessarily long responses.
- Be friendly and professional.
- Focus on understanding the customer's needs.
`;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const customerSchema = {
  type: "object",
  properties: {
    customer_name: {
      type: ["string", "null"],
    },
    budget_inr: {
      type: ["number", "null"],
    },
    location: {
      type: ["string", "null"],
    },
    property_type: {
      type: ["string", "null"],
    },
    lead_status: {
      type: "string",
      enum: ["new", "interested", "qualified", "not_interested"],
    },
    next_question: {
      type: "string",
    },
  },
  required: [
    "customer_name",
    "budget_inr",
    "location",
    "property_type",
    "lead_status",
    "next_question",
  ],
  additionalProperties: false,
};


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
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions: `
    You are an AI real estate sales assistant.

    Extract customer information from the message.

    Rules:
    - Never invent customer details.
    - If a detail is missing, return null.
    - Convert budgets into Indian rupees.
    - Classify the lead accurately.
    - Ask one relevant follow-up question.
    - Return only information supported by the conversation.
  `,
      //instructions: systemPrompt,
      input: message.trim(),
      text: {
    format: {
      type: "json_schema",
      name: "customer_lead",
      strict: true,
      schema: customerSchema,
    },
  },
    });

   {/*return res.status(200).json({
      success: true,
      reply: response.output_text,
    });*/}

    
    const customerData = JSON.parse(response.output_text);
    return res.status(200).json({
      success: true,
      data: customerData,
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
