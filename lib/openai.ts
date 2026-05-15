import OpenAI from "openai";
import { getPromptTemplate, replacePromptVariables, PROMPT_NAMES } from "./prompt-templates";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate review texts using OpenAI
 * Returns multiple review drafts for pre-generation
 */
export async function generateReviewTexts(
  companyName: string,
  category: string,
  count: number = 15
): Promise<Array<{ content: string; rating: number }>> {
  const template = await getPromptTemplate(PROMPT_NAMES.REVIEW_GENERATOR);

  if (!template) {
    throw new Error("Review generator prompt template not found");
  }

  const prompt = replacePromptVariables(template.content, {
    companyName,
    category,
    count,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Cheapest capable model
    messages: [
      {
        role: "system",
        content: "Bạn là chuyên gia viết đánh giá. Chỉ trả về JSON hợp lệ.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8, // Creative but controlled
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  // Handle both array directly or wrapped object
  if (Array.isArray(result)) {
    return result;
  }
  if (result.reviews) {
    return result.reviews;
  }
  // Try to find any array in the response
  const values = Object.values(result);
  for (const v of values) {
    if (Array.isArray(v)) return v;
  }

  throw new Error("Could not parse review texts from AI response");
}

/**
 * Generate a single review on-demand (fallback when pool exhausted)
 */
export async function generateSingleReview(
  companyName: string,
  category: string
): Promise<{ content: string; rating: number }> {
  const reviews = await generateReviewTexts(companyName, category, 1);
  return reviews[0];
}

/**
 * Generate keywords and hashtags from company info using AI
 */
export async function generateCompanyKeywords(data: {
  name: string;
  address: string;
  category: string;
  phone?: string;
  website?: string;
}): Promise<{ keywords: string; hashtags: string }> {
  const template = await getPromptTemplate(PROMPT_NAMES.HASHTAG_GENERATOR);

  if (!template) {
    throw new Error("Hashtag generator prompt template not found");
  }

  const prompt = replacePromptVariables(template.content, {
    companyName: data.name,
    address: data.address,
    category: data.category,
    phone: data.phone || "Không có",
    website: data.website || "Không có",
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Bạn là chuyên gia SEO và marketing. Chỉ trả về JSON hợp lệ.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  return {
    keywords: result.keywords || "",
    hashtags: result.hashtags || "",
  };
}