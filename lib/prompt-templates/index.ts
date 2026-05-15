import { prisma } from "@/lib/prisma";

export const PROMPT_NAMES = {
  REVIEW_GENERATOR: "review-generator",
  HASHTAG_GENERATOR: "hashtag-generator",
} as const;

export type PromptName = (typeof PROMPT_NAMES)[keyof typeof PROMPT_NAMES];

/**
 * Get prompt template by name from database
 */
export async function getPromptTemplate(
  name: PromptName
): Promise<{ content: string; version: number } | null> {
  const template = await prisma.promptTemplate.findUnique({
    where: { name },
    select: { content: true, version: true },
  });

  if (!template) return null;

  return {
    content: template.content,
    version: template.version,
  };
}

/**
 * Update prompt template content
 */
export async function updatePromptTemplate(
  name: PromptName,
  content: string
): Promise<{ id: string; name: string; content: string; version: number }> {
  const template = await prisma.promptTemplate.upsert({
    where: { name },
    create: {
      name,
      content,
      description: name === PROMPT_NAMES.REVIEW_GENERATOR
        ? "Prompt để generate review tự động cho mã QR"
        : "Prompt để generate keywords và hashtags cho công ty",
    },
    update: {
      content,
    },
  });

  return {
    id: template.id,
    name: template.name,
    content: template.content,
    version: template.version,
  };
}

/**
 * Get all prompt templates
 */
export async function getAllPromptTemplates() {
  return prisma.promptTemplate.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Replace variables in prompt template
 * {{companyName}} -> "Nhà hàng A"
 * {{category}} -> "Nhà hàng"
 */
export function replacePromptVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => String(variables[key] ?? "")
  );
}