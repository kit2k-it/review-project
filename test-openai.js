import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello" },
      ],
      max_tokens: 10,
    });
    console.log("OpenAI response:", response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI error:", error.message, error.code);
  }
}

test();
