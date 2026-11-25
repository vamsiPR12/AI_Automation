import "dotenv/config";
import OpenAI from "openai";

// 1. Connect to OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. Create an async function
async function chat() {
  try {
    // 3. User message
    const message = "Explain Node.js in simple words";

    // 4. Send message to AI
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      input: message,
    });

    // 5. Print AI response
    console.log("AI Response:", response.output_text);

  } catch (error) {
    console.log("Something went wrong:", error.message);
  }
}

// 6. Execute function
chat();
