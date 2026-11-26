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

Extract customer information from the message.

    Rules:
    - Never invent customer details.
    - If a detail is missing, return null.
    - Convert budgets into Indian rupees.
    - Classify the lead accurately.
    - Ask one relevant follow-up question.
    - Return only information supported by the conversation.


CONVERSATION STYLE:
- Use simple English.
- Avoid unnecessarily long responses.
- Be friendly and professional.
- Focus on understanding the customer's needs.

TOOL USAGE:
- When a customer asks about property availability,
  use check_property_availability.
- Never claim availability without checking the tool result.
- Explain the returned result clearly to the customer.

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


const tools = [
  {
    type: "function" as const,
    name: "check_property_availability",
    description:
      "Check whether a property type is available in a particular location.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        property_type: {
          type: "string",
          description: "Property type such as 2BHK or 3BHK",
        },
        location: {
          type: "string",
          description: "City or area where the customer wants a property",
        },
      },
      required: ["property_type", "location"],
      additionalProperties: false,
    },
  },
];


async function checkPropertyAvailability(
  propertyType: string,
  location: string
) {
  return {
    property_type: propertyType,
    location: location,
    available: true,
    message: "Demo inventory: matching properties found.",
  };
}


router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // 1. Send customer message and available tools to OpenAI
let response = await openai.responses.create({
  model: process.env.OPENAI_MODEL!,
  instructions: systemPrompt,
  input: message.trim(),
  tools: tools,
});

// 2. Find function calls requested by OpenAI
const functionCalls = response.output.filter(
  (item) => item.type === "function_call"
);

// 3. Execute the requested functions
if (functionCalls.length > 0) {
  const toolOutputs = await Promise.all(
    functionCalls.map(async (call) => {
      if (call.name === "check_property_availability") {
        const args = JSON.parse(call.arguments);

        const result = await checkPropertyAvailability(
          args.property_type,
          args.location
        );

        return {
          type: "function_call_output" as const,
          call_id: call.call_id,
          output: JSON.stringify(result),
        };
      }

      throw new Error(`Unknown tool: ${call.name}`);
    })
  );

  // 4. Send function results back to OpenAI
  response = await openai.responses.create({
    model: process.env.OPENAI_MODEL!,
    instructions: systemPrompt,
    previous_response_id: response.id,
    input: toolOutputs,
    tools: tools,
  });
}

// 5. Return the final AI response
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
