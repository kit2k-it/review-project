import { prisma } from "@/lib/prisma";

const DEFAULT_REVIEWS_PROMPT = `Bạn là chuyên gia viết đánh giá cho doanh nghiệp.

Viết {{count}} đánh giá ngắn, tự nhiên, đa dạng cho "{{companyName}}" (danh mục: {{category}}).
Mỗi đánh giá 40-80 từ với:
- Giọng điệu khác nhau (vui vẻ, bình thường, ngạc nhiên, hài lòng)
- Ưu điểm cụ thể về: chất lượng sản phẩm/dịch vụ, thái độ phục vụ, không gian, giá cả
- Rating 4-5 sao (có thể có vài review 4 sao với góp ý nhẹ)
- KHÔNG có tên người cụ thể

Format: JSON array với các object có format:
{"content": "...", "rating": 5}

Chỉ trả về JSON array, không có gì khác.`;

const DEFAULT_HASHTAGS_PROMPT = `Phân tích doanh nghiệp sau và trả về từ khóa + hashtags phù hợp cho việc SEO và marketing:

Tên: {{companyName}}
Địa chỉ: {{address}}
Danh mục: {{category}}
Số điện thoại: {{phone}}
Website: {{website}}

Trả về JSON:
{
  "keywords": "danh sách từ khóa, phân cách bằng dấu phẩy (tiếng Anh, 8-12 từ khóa chính)",
  "hashtags": "danh sách hashtags phù hợp, phân cách bằng dấu phẩy (5-8 hashtags)"
}

Quy tắc:
- Keywords: từ khóa tiếng Anh phổ biến cho SEO (ví dụ: restaurant, vietnamese food, ho chi minh city, fine dining)
- Hashtags: hashtags tiếng Anh viết liền không dấu (ví dụ: #vietnamesefood, #hochiminhcity, #localfood)
- Phù hợp với danh mục: {{category}}
- KHÔNG trả về gì ngoài JSON`;

/**
 * Seed default prompt templates if they don't exist
 */
export async function seedPromptTemplates() {
  const reviewTemplate = await prisma.promptTemplate.findUnique({
    where: { name: "review-generator" },
  });

  if (!reviewTemplate) {
    await prisma.promptTemplate.create({
      data: {
        name: "review-generator",
        description: "Prompt để generate review tự động cho mã QR",
        content: DEFAULT_REVIEWS_PROMPT,
      },
    });
    console.log("✅ Created default review-generator prompt template");
  }

  const hashtagTemplate = await prisma.promptTemplate.findUnique({
    where: { name: "hashtag-generator" },
  });

  if (!hashtagTemplate) {
    await prisma.promptTemplate.create({
      data: {
        name: "hashtag-generator",
        description: "Prompt để generate keywords và hashtags cho công ty",
        content: DEFAULT_HASHTAGS_PROMPT,
      },
    });
    console.log("✅ Created default hashtag-generator prompt template");
  }
}