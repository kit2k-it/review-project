import OpenAI from "openai";

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
  const prompt = `Bạn là chuyên gia viết đánh giá cho doanh nghiệp.

Viết ${count} đánh giá ngắn, tự nhiên, đa dạng cho "${companyName}" (danh mục: ${category}).
Mỗi đánh giá 40-80 từ với:
- Giọng điệu khác nhau (vui vẻ, bình thường, ngạc nhiên, hài lòng)
- Ưu điểm cụ thể về: chất lượng sản phẩm/dịch vụ, thái độ phục vụ, không gian, giá cả
- Rating 4-5 sao (có thể có vài review 4 sao với góp ý nhẹ)
- KHÔNG có tên người cụ thể

Format: JSON array với các object có format:
{"content": "...", "rating": 5}

Chỉ trả về JSON array, không có gì khác.`;

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
